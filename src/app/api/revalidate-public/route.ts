import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * POST /api/revalidate-public
 *
 * Called by the admin panel after any successful clinic_settings write.
 * Purges the Next.js full-route cache for every public page that renders
 * data from that table so visitors immediately see the new content.
 */
export async function POST() {
  revalidatePath("/", "layout");   // covers / and all nested routes
  revalidatePath("/nosotros");
  revalidatePath("/servicios");
  return NextResponse.json({ revalidated: true });
}
