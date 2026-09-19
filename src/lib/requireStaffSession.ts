import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Verifies the caller forwarded a valid Supabase session as
 * `Authorization: Bearer <access_token>` (see src/lib/authFetch.ts for the
 * matching client-side helper that attaches it). This app's browser client
 * persists its session in cookies as well as localStorage (src/lib/supabase.ts),
 * which is what lets middleware.ts gate /admin/* page navigation — but a
 * fetch() call from a client component to an API route doesn't carry those
 * cookies the same way, so every internal API route that touches patient
 * data or costs money per call verifies the token explicitly here.
 *
 * There's no separate admin role in this project — any signed-in Supabase
 * Auth user is clinic staff, matching every RLS policy already in place.
 */
export async function requireStaffSession(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return false;

  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);
  return !error && !!user;
}
