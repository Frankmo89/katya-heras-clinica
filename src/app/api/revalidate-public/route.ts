import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireStaffSession } from "@/lib/requireStaffSession";

/**
 * POST /api/revalidate-public
 *
 * Called by the admin panel after any successful write to clinic_settings,
 * services, or products. Purges the Next.js full-route cache for every
 * public page that renders that data so visitors see the change without a
 * redeploy.
 *
 * Requires a valid Supabase session, forwarded as `Authorization: Bearer
 * <access_token>` by src/lib/revalidatePublic.ts. The browser client
 * (src/lib/supabase.ts) persists its session in localStorage rather than
 * cookies, so this route has no other way to see who's calling it — the
 * token is verified directly against Supabase Auth below. There's no
 * separate admin role in this project (see 0002_create_admin_tables.sql
 * and friends): any signed-in Supabase Auth user is clinic staff, matching
 * every RLS policy in this app.
 *
 * revalidatePath("/", "layout") already invalidates everything under the
 * root layout (i.e. every route in the app, since app/layout.tsx wraps the
 * whole site) — the calls below are kept anyway to be explicit about which
 * routes matter here, and revalidatePath("/servicios/[id]", "page") is
 * required on top of that because dynamic segments aren't implied by a
 * static path string.
 */
export async function POST(request: Request) {
  if (!(await requireStaffSession(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidatePath("/", "layout");   // covers / and all nested routes
  revalidatePath("/nosotros");
  revalidatePath("/servicios");
  revalidatePath("/servicios/[id]", "page");
  revalidatePath("/tienda");
  return NextResponse.json({ revalidated: true });
}
