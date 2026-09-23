import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { resendFromAddress } from "@/lib/emailFrom";
import {
  PATIENT_CONFIRM_COPY,
  buildPatientConfirmHtml,
  formatPriceLabel,
  resolveMapsUrl,
  type PatientConfirmEmailData,
  type PatientConfirmLang,
} from "@/lib/patientConfirmationEmail";

if (!process.env.RESEND_API_KEY) {
  console.warn(
    "[send-patient-confirmation] RESEND_API_KEY is not set — emails will fail silently. " +
    "Add it to .env.local: RESEND_API_KEY=re_xxxxxxxxxx"
  );
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Only the booking gets to say who the recipient is and what the content
// says — this route used to accept patientEmail and every display field
// directly from the request body, which let anyone POST arbitrary
// recipients and content through the clinic's Resend account (an open mail
// relay, and — once katyaheras.app is verified — a fast way to wreck that
// domain's sender reputation). Now the client supplies only enough to look
// the booking up; everything else comes from the database.
type RequestPayload = {
  bookingId: string;
  bookingRef: string;
  lang?: "es" | "en";
};

const RECENCY_MINUTES = 15;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (!rateLimit(`send-patient-confirmation:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: RequestPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { bookingId, bookingRef } = body;
  const lang: PatientConfirmLang = body.lang === "en" ? "en" : "es";
  if (!bookingId || !bookingRef) {
    return NextResponse.json({ error: "Missing bookingId or bookingRef" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Atomic claim: only a request that flips patient_email_sent_at from null
  // to now() proceeds to actually send. Everything else (wrong id/ref,
  // already sent, too old, already cancelled) fails this same check, and
  // gets the exact same response below — deliberately not distinguishing
  // *why* it didn't send, so this can't be used to probe which
  // (bookingId, bookingRef) pairs are valid.
  const recencyCutoff = new Date(Date.now() - RECENCY_MINUTES * 60 * 1000).toISOString();
  const claimedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from("bookings")
    .update({ patient_email_sent_at: claimedAt })
    .eq("id", bookingId)
    .eq("booking_ref", bookingRef)
    .is("patient_email_sent_at", null)
    .neq("status", "cancelled")
    .gt("created_at", recencyCutoff)
    .select("patient_email, patient_name, service_id, starts_at, notes")
    .maybeSingle();

  if (claimError) {
    console.error("[send-patient-confirmation] Claim query error:", claimError.message);
  }
  if (!claimed) {
    // Not found, already sent, cancelled, or past the recency window —
    // same response either way. Not an error: this is the expected outcome
    // for a stale or repeated call, not just for abuse.
    return NextResponse.json({ sent: false });
  }
  if (!claimed.patient_email || !claimed.starts_at) {
    // Admin-created bookings can have no email at all (staff-only field is
    // optional there) — nothing to send to. Already claimed above, so this
    // can't be retried, which is correct: there was never anything to send.
    return NextResponse.json({ sent: false });
  }

  const markFailed = async () => {
    await supabase
      .from("bookings")
      .update({
        patient_email_sent_at: null,
        patient_email_last_status: "failed",
        patient_email_last_attempt_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .eq("booking_ref", bookingRef);
  };

  try {
    const [{ data: svc }, { data: settings }] = await Promise.all([
      supabase
        .from("services")
        .select("title_es, title_en, duration_minutes, price")
        .eq("id", claimed.service_id)
        .maybeSingle(),
      supabase
        .from("clinic_settings")
        .select("physical_address, maps_url, instructions_pre_appointment, whatsapp_number, currency")
        .eq("id", 1)
        .single(),
    ]);

    if (!svc || !settings) {
      console.error("[send-patient-confirmation] Missing service or clinic_settings row for", bookingId);
      await markFailed();
      return NextResponse.json({ sent: false });
    }

    const serviceName = (lang === "es" ? svc.title_es : svc.title_en) ?? svc.title_es;

    const emailData: PatientConfirmEmailData = {
      lang,
      patientName: claimed.patient_name,
      serviceName,
      durationMinutes: svc.duration_minutes ?? 60,
      priceLabel: formatPriceLabel(Number(svc.price ?? 0), settings.currency as "MXN" | "USD"),
      startIso: claimed.starts_at,
      bookingRef,
      address: settings.physical_address,
      mapsUrl: resolveMapsUrl(settings.maps_url, settings.physical_address),
      whatToBring: settings.instructions_pre_appointment,
      whatsappNumber: settings.whatsapp_number,
    };

    const { error } = await resend.emails.send({
      from:    resendFromAddress(),
      to:      [claimed.patient_email],
      subject: PATIENT_CONFIRM_COPY[lang].subject(bookingRef),
      html:    buildPatientConfirmHtml(emailData),
    });

    if (error) {
      // Claim ran before the send so a crashed/aborted request cannot
      // double-mail. On a definitive Resend rejection we release the claim
      // so a later retry (or a from-address fix) can try again — and record
      // last_status=failed so admin citas can show who needs a nudge.
      console.error("[send-patient-confirmation] Resend error:", JSON.stringify(error));
      await markFailed();
      return NextResponse.json({ sent: false, error: "resend_failed" });
    }

    await supabase
      .from("bookings")
      .update({
        patient_email_last_status: "sent",
        patient_email_last_attempt_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .eq("booking_ref", bookingRef);

    console.log(`[send-patient-confirmation] Sent to booking ${bookingId} (${bookingRef})`);
    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[send-patient-confirmation] Unexpected error:", err);
    try {
      await markFailed();
    } catch { /* best-effort release */ }
    return NextResponse.json({ sent: false });
  }
}
