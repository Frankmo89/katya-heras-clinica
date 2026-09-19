import { ImageValidationError } from "@/lib/uploadImage";

/**
 * Converts a thrown error (raw Postgres/Supabase message, network error, or
 * a known validation error) into a short, user-facing Spanish message.
 * The raw error is always logged so the real cause is still debuggable.
 */
export function toFriendlyMessage(err: unknown): string {
  console.error(err);

  if (err instanceof ImageValidationError) return err.message;

  const raw = err instanceof Error ? err.message : String(err);

  if (/row-level security/i.test(raw)) {
    return "No tienes permiso para realizar esta acción.";
  }
  if (/JWT|session|not authenticated|401/i.test(raw)) {
    return "Tu sesión expiró. Vuelve a iniciar sesión.";
  }
  if (/Failed to fetch|NetworkError|fetch failed/i.test(raw)) {
    return "No hay conexión con el servidor. Intenta de nuevo.";
  }
  if (/duplicate key|already exists/i.test(raw)) {
    return "Ya existe un registro con esos datos.";
  }

  return "Ocurrió un error inesperado. Intenta de nuevo.";
}
