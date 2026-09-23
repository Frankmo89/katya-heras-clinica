import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// Shared by every admin image-upload flow (services, shop, clinic settings).
// Centralizing this fixes two Phase-4 issues at once: filenames were built
// from the user-supplied File.name (uploadToStorage previously did
// `file.name.split(".").pop()`), and there was no type/size check before
// the browser client uploaded straight to Supabase Storage.
//
// Auth note (RLS): supabase-js `_getAccessToken()` falls back to the anon
// key when `auth.getSession()` returns null. Storage INSERT policies are
// `TO authenticated`, so that fallback surfaces as
// "new row violates row-level security policy". We therefore resolve the
// staff JWT explicitly and upload through a short-lived user-scoped client
// that always sends `Authorization: Bearer <access_token>` — never the
// service-role key, never an unauthenticated anon write.

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_BUCKETS = new Set([
  "service-images",
  "shop-images",
  "public_assets",
]);

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
 * Resolves a live staff access token for Storage writes.
 * Prefers getSession(); if empty while the operator is in /admin, tries
 * getUser() + refreshSession() so a stale cookie/memory gap does not
 * silently degrade the request to the anon key.
 */
async function resolveStaffAccessToken(): Promise<string> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("[uploadImage] getSession error", sessionError);
  }

  if (session?.access_token) {
    return session.access_token;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  console.error("[uploadImage] session missing at upload time", {
    userId: user?.id ?? null,
    userError,
  });

  if (!user) {
    throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  }

  const { data: refreshed, error: refreshError } =
    await supabase.auth.refreshSession();
  if (refreshError) {
    console.error("[uploadImage] refreshSession error", refreshError);
  }

  const token = refreshed.session?.access_token;
  if (!token) {
    throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  }
  return token;
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

  if (!ALLOWED_BUCKETS.has(bucket)) {
    console.error("[uploadImage] rejected unknown bucket", { bucket });
    throw new Error("Bucket de almacenamiento no permitido.");
  }

  const ext = ALLOWED_MIME_TO_EXT[file.type];
  const baseName =
    opts.fileName ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${folder}/${baseName}.${ext}`;
  const upsert = opts.upsert ?? false;

  const accessToken = await resolveStaffAccessToken();

  // User-scoped client: anon key + staff JWT. RLS still applies as
  // `authenticated`. Service-role stays server-only elsewhere in the app.
  const authed = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  const { error } = await authed.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert,
    contentType: file.type,
  });

  if (error) {
    console.error("[uploadImage] storage.objects write failed", {
      bucket,
      path,
      upsert,
      error,
      message: error.message,
      // StorageError often carries these; log raw for debugging.
      name: (error as { name?: string }).name,
      statusCode: (error as { statusCode?: string | number }).statusCode,
    });
    throw new Error(error.message);
  }

  const { data } = authed.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
