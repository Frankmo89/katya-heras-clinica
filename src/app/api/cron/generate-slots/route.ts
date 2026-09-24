import { CLINIC_TIMEZONE } from "@/lib/clinicTimezone";
import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { resendFromAddress } from "@/lib/emailFrom";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Emails the clinic when the nightly slot generation looks broken — either
 * the RPC errored, or it ran but inserted zero rows. Zero is a real signal
 * here, not just a quiet night: the 60-day horizon slides forward by
 * exactly one day every time this runs, so a healthy run almost always
 * inserts at least that new day's slots. Best-effort — a failure here is
 * logged, never thrown, so it can't turn a slot-generation problem into an
 * unhandled route error too.
 */
async function alertClinic(supabase: SupabaseClient, reason: string) {
  try {
    const { data: settings } = await supabase
      .from("clinic_settings")
      .select("contact_email")
      .eq("id", 1)
      .single();
    const to = (settings as { contact_email?: string } | null)?.contact_email;
    if (!to) {
      console.error("[cron/generate-slots] No contact_email on file — cannot send alert.");
      return;
    }
    await resend.emails.send({
      from:    resendFromAddress(),
      to:      [to],
      subject: "⚠️ [Katya Heras] La calendarización automática necesita atención",
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1E293B;">
        <p><strong>La generación nocturna de horarios no funcionó como se esperaba.</strong></p>
        <p>${reason}</p>
        <p>Revisa el contador de "horarios disponibles" en el panel de administración
        (/admin) y, si está en cero o muy bajo, corre <code>generate_available_slots</code>
        manualmente desde el editor SQL de Supabase.</p>
      </div>`,
    });
  } catch (err) {
    console.error("[cron/generate-slots] Failed to send alert email:", err);
  }
}

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

  // toISOString() would give the UTC calendar date, which during Tecate
  // evenings is already tomorrow — compute "today" in the clinic's own
  // timezone instead, then add 60 calendar days as plain UTC-based date
  // math (no timezone reinterpretation involved, so no DST/offset risk).
  const from = new Intl.DateTimeFormat("en-CA", { timeZone: CLINIC_TIMEZONE }).format(new Date());
  const [y, m, d] = from.split("-").map(Number);
  const to = new Date(Date.UTC(y, m - 1, d + 60)).toISOString().split("T")[0];

  const { data, error } = await supabase.rpc("generate_available_slots", {
    p_from: from,
    p_to: to,
  });

  if (error) {
    console.error("[cron/generate-slots] error:", error.message);
    await alertClinic(supabase, `Error: <code>${error.message}</code>`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data === 0) {
    console.warn("[cron/generate-slots] Inserted 0 slots — flagging for review.");
    await alertClinic(
      supabase,
      "La función se ejecutó sin errores, pero no insertó ningún horario nuevo — " +
        "eso es inusual, ya que cada noche debería agregar al menos el día que se " +
        "acaba de sumar a la ventana de 60 días."
    );
  }

  return NextResponse.json({ inserted: data });
}
