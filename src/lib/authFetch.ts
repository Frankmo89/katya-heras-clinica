import { supabase } from "@/lib/supabase";

/**
 * Headers carrying the current session's access token, for calling an
 * internal API route protected by requireStaffSession(). Returns `{}` when
 * signed out — the route rejects the request with 401 either way, this
 * just avoids sending a malformed header.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}
