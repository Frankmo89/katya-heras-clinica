import { createBrowserClient } from "@supabase/ssr";

console.log(
  "Supabase URL loaded:",   !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  "Supabase Key loaded:",   !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// createBrowserClient (not the plain createClient) persists the session in
// cookies as well as localStorage, so middleware.ts can see it server-side
// — that's the only reason /admin/* can be gated before a page ever
// renders. Same SupabaseClient API otherwise; no caller needs to change.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnon);
