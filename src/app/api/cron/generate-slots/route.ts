import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Fallback for 0034_schedule_nightly_slot_generation.sql's pg_cron job, in
 * case pg_cron isn't available on this Supabase plan. Configured to run on
 * the same schedule via vercel.json's `crons` entry. Running both is
 * harmless — generate_available_slots() is idempotent (0031) — just
 * redundant; keep whichever one actually works and remove the other.
 *
 * Vercel signs cron requests with a bearer token matching the CRON_SECRET
 * env var (set one in the Vercel project settings, no fixed value — any
 * random secret works, it just has to match what's configured there).
 * Without this check, this route would let anyone trigger slot generation
 * for free by hitting the URL directly — low severity (no patient data
 * involved) but no reason to leave it open.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const today = new Date();
  const from = today.toISOString().split("T")[0];
  const toDate = new Date(today);
  toDate.setDate(toDate.getDate() + 60);
  const to = toDate.toISOString().split("T")[0];

  const { data, error } = await supabase.rpc("generate_available_slots", {
    p_from: from,
    p_to: to,
  });

  if (error) {
    console.error("[cron/generate-slots] error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: data });
}
