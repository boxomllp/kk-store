import { createClient } from "@/lib/supabase/client";

/**
 * Resize + compress an image client-side (canvas) before uploading, so we
 * never ship multi-megabyte product photos straight from a phone camera.
 * Caps the longest edge at maxDimension and re-encodes as JPEG/WebP at the
 * given quality. Falls back to the original file if compression fails.
 */
async function compressImage(file: File, maxDimension = 1600, quality = 0.8): Promise<Blob> {
  // Don't try to re-compress SVGs — they're vector and already tiny.
  if (file.type === "image/svg+xml") return file;

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

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, outputType, quality)
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

/**
 * Compress + upload an image to a Supabase Storage bucket with a
 * long cache lifetime (images are content-hashed by filename+timestamp,
 * so a 1-year cache is safe — a re-upload gets a new URL).
 */
export async function uploadImage(
  file: File,
  path: string,
  bucket = "product-images"
): Promise<string | null> {
  const supabase = createClient();
  const compressed = await compressImage(file);

  const { error } = await supabase.storage.from(bucket).upload(path, compressed, {
    cacheControl: "31536000", // 1 year — safe since each upload gets a unique path
    upsert: false,
    contentType: file.type === "image/png" ? "image/png" : "image/jpeg",
  });

  if (error) return null;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
