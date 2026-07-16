import { createClient } from "@/lib/supabase/client";

/**
 * Supabase Storage rejects keys with spaces or many special characters
 * (e.g. macOS screenshot filenames like "Screenshot 2026-07-16 at
 * 4.25.35 PM.png" fail with "Invalid key"). Strip the name down to a
 * safe, storage-key-friendly slug and keep the original extension.
 */
function sanitizeFilename(name: string): string {
  const lastDot = name.lastIndexOf(".");
  const ext = lastDot > -1 ? name.slice(lastDot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const base = (lastDot > -1 ? name.slice(0, lastDot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return `${base || "image"}${ext ? `.${ext}` : ""}`;
}

/**
 * Resize + compress an image client-side (canvas) before uploading, so we
 * never ship multi-megabyte product photos straight from a phone camera.
 * Caps the longest edge at maxDimension and re-encodes as JPEG/WebP at the
 * given quality. Falls back to the original file if compression fails.
 */
async function compressImage(file: File, maxDimension = 1600, quality = 0.8): Promise<File | Blob> {
  // Don't try to re-compress SVGs — they're vector and already tiny.
  if (file.type === "image/svg+xml") return file;
  if (typeof window === "undefined" || typeof createImageBitmap === "undefined") return file;

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    if (width > maxDimension || height > maxDimension) {
      const scale = maxDimension / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, outputType, quality)
    );
    // Only use the compressed version if it's actually smaller — otherwise
    // keep the original (protects against edge cases where re-encoding
    // bloats the file, e.g. already-optimized images).
    if (blob && blob.size > 0 && blob.size < file.size) return blob;
    return file;
  } catch (err) {
    console.error("Image compression failed, uploading original file instead:", err);
    return file;
  }
}

export type UploadResult = { url: string | null; error?: string };

/**
 * Compress + upload an image to a Supabase Storage bucket with a
 * long cache lifetime (images are content-hashed by filename+timestamp,
 * so a 1-year cache is safe — a re-upload gets a new URL).
 *
 * `folder` is just the storage prefix (e.g. "products", "content",
 * "settings/hero_image") — the actual filename is sanitized and
 * timestamped here, so callers never need to worry about invalid
 * storage keys from spaces/special characters in the original filename.
 */
export async function uploadImage(
  file: File,
  folder: string,
  bucket = "product-images"
): Promise<UploadResult> {
  try {
    const supabase = createClient();
    const compressed = await compressImage(file);
    const path = `${folder}/${Date.now()}-${sanitizeFilename(file.name)}`;

    const { error } = await supabase.storage.from(bucket).upload(path, compressed, {
      cacheControl: "31536000", // 1 year — safe since each upload gets a unique path
      upsert: false,
      contentType: file.type === "image/png" ? "image/png" : "image/jpeg",
    });

    if (error) {
      console.error("Supabase storage upload failed:", error);
      return { url: null, error: error.message };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (err: any) {
    console.error("Unexpected upload error:", err);
    return { url: null, error: err?.message || "Unexpected error during upload" };
  }
}
