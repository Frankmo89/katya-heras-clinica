import { supabase } from "@/lib/supabase";

// Shared by every admin image-upload flow (services, shop, clinic settings).
// Centralizing this fixes two Phase-4 issues at once: filenames were built
// from the user-supplied File.name (uploadToStorage previously did
// `file.name.split(".").pop()`), and there was no type/size check before
// the browser client uploaded straight to Supabase Storage.

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export class ImageValidationError extends Error {}

export function validateImageFile(file: File): void {
  if (!ALLOWED_MIME_TO_EXT[file.type]) {
    throw new ImageValidationError(
      "Formato de imagen no permitido. Usa JPG, PNG o WEBP.",
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ImageValidationError(
      "La imagen pesa demasiado. El máximo permitido es 5 MB.",
    );
  }
}

interface UploadOptions {
  /** Fixed file name (without extension) — used for upsert-style uploads like the hero image. */
  fileName?: string;
  upsert?: boolean;
}

/**
 * Validates and uploads an image to a Supabase Storage bucket, returning its
 * public URL. The stored file name is always derived from the MIME type and
 * a random/fixed slug — never from the user-supplied File.name.
 */
export async function uploadImage(
  file: File,
  bucket: string,
  folder: string,
  opts: UploadOptions = {},
): Promise<string> {
  validateImageFile(file);
  const ext = ALLOWED_MIME_TO_EXT[file.type];
  const baseName =
    opts.fileName ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${folder}/${baseName}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: opts.upsert ?? false,
      contentType: file.type,
    });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
