import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Gates every /admin/* route server-side, before any page renders.
//
// Previously the only check was client-side (admin/layout.tsx calling
// supabase.auth.getSession() in a useEffect), so an unauthenticated
// request received the full page HTML/JS and only got redirected after
// hydration — confirmed live: `curl /admin/pacientes/<id>` with no
// session returned 200 with the full page shell.
//
// This requires session state to be readable from the request, which is
// why src/lib/supabase.ts now uses createBrowserClient (cookie-backed)
// instead of the plain createClient (localStorage-only, invisible here).
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() (not getSession()) actually validates the token against
  // Supabase Auth rather than trusting whatever the cookie claims.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname !== "/admin/login") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
