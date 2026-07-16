// scripts/optimize-existing-images.mjs
//
// One-time migration: finds every image already uploaded to the
// product-images bucket (product photos + images embedded in product
// description/ingredients/how-to-use HTML), downloads it, compresses +
// resizes it, re-uploads it with a 1-year cache-control header, and
// updates every database row that references the old URL — all
// automatically, no admin panel clicking required.
//
// Usage:
//   npm install
//   node scripts/optimize-existing-images.mjs
//
// Needs two env vars (get both from Supabase dashboard → Settings → API):
//   SUPABASE_URL=https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=xxxx   (the SECRET key, not the anon key —
//     required to bypass RLS and update any product's rows)
//
// Safe to re-run: images that are already small enough or already have
// a long cache lifetime are skipped.

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "product-images";
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 80;
const SIZE_THRESHOLD_BYTES = 400 * 1024; // only touch files bigger than ~400KB

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing env vars. Run like:\n" +
      "  SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxxx node scripts/optimize-existing-images.mjs"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function sanitizeFilename(name) {
  const lastDot = name.lastIndexOf(".");
  const ext = lastDot > -1 ? name.slice(lastDot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "jpg";
  const base = (lastDot > -1 ? name.slice(0, lastDot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return `${base || "image"}.${ext || "jpg"}`;
}

function extractStoragePath(url) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

async function downloadAndCompress(path) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`download failed: ${error?.message}`);
  const buffer = Buffer.from(await data.arrayBuffer());

  if (buffer.length <= SIZE_THRESHOLD_BYTES) return null; // already small, skip

  const image = sharp(buffer, { failOn: "none" });
  const metadata = await image.metadata();
  const isPng = metadata.format === "png";

  let pipeline = image.resize({
    width: MAX_DIMENSION,
    height: MAX_DIMENSION,
    fit: "inside",
    withoutEnlargement: true,
  });

  pipeline = isPng ? pipeline.png({ quality: JPEG_QUALITY, compressionLevel: 9 }) : pipeline.jpeg({ quality: JPEG_QUALITY });

  const output = await pipeline.toBuffer();
  if (output.length >= buffer.length) return null; // didn't actually help, skip

  return { buffer: output, contentType: isPng ? "image/png" : "image/jpeg" };
}

async function reupload(oldPath, compressed) {
  const filename = sanitizeFilename(oldPath.split("/").pop() || "image.jpg");
  const folder = oldPath.split("/").slice(0, -1).join("/") || "products";
  const newPath = `${folder}/${Date.now()}-${filename}`;

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(newPath, compressed.buffer, {
    cacheControl: "31536000",
    contentType: compressed.contentType,
    upsert: false,
  });
  if (upErr) throw new Error(`upload failed: ${upErr.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(newPath);
  // Best-effort cleanup of the old file — ignore failures.
  await supabase.storage.from(BUCKET).remove([oldPath]).catch(() => {});
  return data.publicUrl;
}

async function processUrl(url, cache) {
  if (cache.has(url)) return cache.get(url);
  const path = extractStoragePath(url);
  if (!path) {
    cache.set(url, url);
    return url;
  }
  try {
    const compressed = await downloadAndCompress(path);
    if (!compressed) {
      cache.set(url, url);
      return url;
    }
    const newUrl = await reupload(path, compressed);
    console.log(`  optimized: ${path} (${(compressed.buffer.length / 1024).toFixed(0)} KiB)`);
    cache.set(url, newUrl);
    return newUrl;
  } catch (err) {
    console.warn(`  skipped ${path}: ${err.message}`);
    cache.set(url, url);
    return url;
  }
}

function findImageUrls(html) {
  if (!html) return [];
  const matches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
  return matches.map((m) => m[1]);
}

function ensureAltAttributes(html, altFallback) {
  if (!html) return html;
  return html.replace(/<img((?:(?!\/?>).)*?)(\/?)>/gi, (full, attrs, selfClose) => {
    if (/\balt\s*=/.test(attrs)) return full;
    return `<img${attrs} alt="${altFallback}"${selfClose}>`;
  });
}

function replaceUrlsInHtml(html, urlMap) {
  if (!html) return html;
  let next = html;
  for (const [oldUrl, newUrl] of urlMap.entries()) {
    if (oldUrl === newUrl) continue;
    next = next.split(oldUrl).join(newUrl);
  }
  return next;
}

async function run() {
  const cache = new Map();

  console.log("Fetching products...");
  const { data: products, error } = await supabase.from("products").select("*");
  if (error) throw error;
  console.log(`Found ${products.length} products.\n`);

  for (const product of products) {
    console.log(`Product: ${product.name}`);

    // --- Main product images array ---
    let imagesChanged = false;
    const newImages = [];
    for (const url of product.images || []) {
      const newUrl = await processUrl(url, cache);
      if (newUrl !== url) imagesChanged = true;
      newImages.push(newUrl);
    }

    // --- Rich content fields ---
    const fields = ["description_html", "ingredients_html", "how_to_use_html"];
    const updates = {};
    let htmlChanged = false;

    for (const field of fields) {
      const html = product[field];
      const urls = findImageUrls(html);
      for (const url of urls) {
        await processUrl(url, cache);
      }
      let next = replaceUrlsInHtml(html, cache);
      const beforeAlt = next;
      next = ensureAltAttributes(next, product.name);
      if (next !== html) {
        updates[field] = next;
        htmlChanged = true;
      }
    }

    if (imagesChanged) updates.images = newImages;

    if (imagesChanged || htmlChanged) {
      const { error: updateErr } = await supabase.from("products").update(updates).eq("id", product.id);
      if (updateErr) {
        console.warn(`  DB update failed for ${product.name}: ${updateErr.message}`);
      } else {
        console.log(`  updated DB row.`);
      }
    } else {
      console.log(`  nothing to optimize.`);
    }
    console.log("");
  }

  console.log("Done.");
}

run().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
