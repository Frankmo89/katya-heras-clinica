import { createClient } from "@supabase/supabase-js";

console.log(
  "Supabase URL loaded:",   !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  "Supabase Key loaded:",   !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnon);
