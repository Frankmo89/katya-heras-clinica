import { authHeaders } from "@/lib/authFetch";

/**
 * Notifies /api/revalidate-public after a successful admin write.
 *
 * The Supabase client (src/lib/supabase.ts) persists its session in
 * cookies as well as localStorage, but a Route Handler doesn't see those
 * the way a page navigation does — the access token is forwarded
 * explicitly so the route can verify it directly with Supabase Auth (see
 * route.ts). Silently does nothing useful if there's no active session;
 * the route rejects the request either way.
 */
export async function revalidatePublic(): Promise<void> {
  fetch("/api/revalidate-public", {
    method: "POST",
    headers: await authHeaders(),
  }).catch(() => {});
}
