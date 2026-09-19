import { supabase } from "@/lib/supabase";

/**
 * Notifies /api/revalidate-public after a successful admin write.
 *
 * The Supabase client here (src/lib/supabase.ts) persists its session in
 * the browser's localStorage, not cookies — so a server-side Route Handler
 * has no way to see "is this caller logged in" on its own. The access
 * token is forwarded explicitly so the route can verify it directly with
 * Supabase Auth (see route.ts). Silently does nothing if there's no active
 * session; the route rejects the request either way.
 */
export async function revalidatePublic(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  fetch("/api/revalidate-public", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  }).catch(() => {});
}
