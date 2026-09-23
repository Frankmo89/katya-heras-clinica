import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { requireStaffSession } from "@/lib/requireStaffSession";
import { resendFromAddress } from "@/lib/emailFrom";
import {
  PATIENT_CONFIRM_COPY,
  buildPatientConfirmHtml,
  formatPriceLabel,
  resolveMapsUrl,
  type PatientConfirmEmailData,
  type PatientConfirmLang,
} from "@/lib/patientConfirmationEmail";

/**
 * Staff-only patient confirmation resend.
 *
 * - Auth: requireStaffSession (Bearer token), same as other admin APIs.
 * - Bypasses the public 15-minute recency window.
 * - Bypasses the once-only patient_email_sent_at claim (staff may resend
 *   even if already sent).
 * - Rate-limits per booking: cooldown (~2.5 min) AND max 3 staff resends
 *   (patient_email_staff_resend_count), so double-click / spam is blocked.
 * - Loads booking + service + clinic_settings from DB; never trusts client
 *   for email content or recipient.
 * - Does NOT touch overlap / exclusion / confirm_booking / slots.
 */

if (!process.env.RESEND_API_KEY) {
  console.warn(
    "[admin/resend-confirmation] RESEND_API_KEY is not set — emails will fail. " +
      "Add it to .env.local / Vercel: RESEND_API_KEY=re_xxxxxxxxxx"
  );
}

const resend = new Resend(process.env.RESEND_API_KEY);

const STAFF_RESEND_MAX = 3;
const STAFF_RESEND_COOLDOWN_MS = 2.5 * 60 * 1000; // 2.5 minutes

type RequestPayload = {
  bookingId: string;
  lang?: "es" | "en";
};

export async function POST(request: NextRequest) {
  if (!(await requireStaffSession(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RequestPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const bookingId = body.bookingId?.trim();
  const lang: PatientConfirmLang = body.lang === "en" ? "en" : "es";
  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  type BookingRow = {
    id: string;
    booking_ref: string | null;
    patient_email: string | null;
    patient_name: string;
    service_id: string;
    starts_at: string | null;
    status: string;
    patient_email_sent_at: string | null;
    patient_email_last_status: string | null;
    patient_email_last_attempt_at: string | null;
    patient_email_staff_resend_count: number | null;
  };

  const { data: bookingRaw, error: loadError } = await supabase
    .from("bookings")
    .select(
      "id, booking_ref, patient_email, patient_name, service_id, starts_at, status, patient_email_sent_at, patient_email_last_status, patient_email_last_attempt_at, patient_email_staff_resend_count"
    )
    .eq("id", bookingId)
    .maybeSingle();

  const booking = bookingRaw as BookingRow | null;

  if (loadError) {
    console.error("[admin/resend-confirmation] Load error:", loadError.message);
    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }
  if (!booking) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "cancelled", sent: false }, { status: 400 });
  }
  if (!booking.patient_email) {
    return NextResponse.json(
      { error: "no_email", sent: false, message: "La cita no tiene correo del paciente." },
      { status: 400 }
    );
  }
  if (!booking.starts_at || !booking.booking_ref) {
    return NextResponse.json({ error: "incomplete_booking", sent: false }, { status: 400 });
  }

  const staffCount = Number(booking.patient_email_staff_resend_count ?? 0);
  if (staffCount >= STAFF_RESEND_MAX) {
    return NextResponse.json(
      {
        error: "rate_limited",
        reason: "max_resends",
        sent: false,
        staffResendCount: staffCount,
        maxStaffResends: STAFF_RESEND_MAX,
        message: `Límite de ${STAFF_RESEND_MAX} reenvíos manuales alcanzado para esta cita.`,
      },
      { status: 429 }
    );
  }

  if (booking.patient_email_last_attempt_at) {
    const lastMs = new Date(booking.patient_email_last_attempt_at).getTime();
    const elapsed = Date.now() - lastMs;
    if (Number.isFinite(lastMs) && elapsed < STAFF_RESEND_COOLDOWN_MS) {
      const retryAfterSec = Math.ceil((STAFF_RESEND_COOLDOWN_MS - elapsed) / 1000);
      return NextResponse.json(
        {
          error: "rate_limited",
          reason: "cooldown",
          sent: false,
          retryAfterSec,
          message: `Espera ${retryAfterSec}s antes de reenviar de nuevo.`,
        },
        { status: 429 }
      );
    }
  }

  // Consume one staff-resend slot + stamp attempt time BEFORE calling Resend,
  // so double-clicks racing past the read checks still hit the cap / cooldown.
  const attemptAt = new Date().toISOString();
  const nextCount = staffCount + 1;
  const { data: claimed, error: claimError } = await supabase
    .from("bookings")
    .update({
      patient_email_last_attempt_at: attemptAt,
      patient_email_staff_resend_count: nextCount,
    })
    .eq("id", bookingId)
    .eq("patient_email_staff_resend_count", staffCount) // optimistic lock
    .select("id")
    .maybeSingle();

  if (claimError) {
    console.error("[admin/resend-confirmation] Claim error:", claimError.message);
    return NextResponse.json({ error: "claim_failed" }, { status: 500 });
  }
  if (!claimed) {
    // Another parallel click won the race.
    return NextResponse.json(
      {
        error: "rate_limited",
        reason: "concurrent",
        sent: false,
        message: "Otro reenvío ya está en curso. Espera un momento.",
      },
      { status: 429 }
    );
  }

  try {
    const [{ data: svc }, { data: settings }] = await Promise.all([
      supabase
        .from("services")
        .select("title_es, title_en, duration_minutes, price")
        .eq("id", booking.service_id)
        .maybeSingle(),
      supabase
        .from("clinic_settings")
        .select("physical_address, maps_url, instructions_pre_appointment, whatsapp_number, currency")
        .eq("id", 1)
        .single(),
    ]);

    if (!svc || !settings) {
      console.error("[admin/resend-confirmation] Missing service or clinic_settings for", bookingId);
      await supabase
        .from("bookings")
        .update({ patient_email_last_status: "failed" })
        .eq("id", bookingId);
      return NextResponse.json({ sent: false, error: "missing_data" }, { status: 500 });
    }

    const serviceName = (lang === "es" ? svc.title_es : svc.title_en) ?? svc.title_es;
    const bookingRef = booking.booking_ref as string;

    const emailData: PatientConfirmEmailData = {
      lang,
      patientName: booking.patient_name,
      serviceName,
      durationMinutes: svc.duration_minutes ?? 60,
      priceLabel: formatPriceLabel(Number(svc.price ?? 0), settings.currency as "MXN" | "USD"),
      startIso: booking.starts_at,
      bookingRef,
      address: settings.physical_address,
      mapsUrl: resolveMapsUrl(settings.maps_url, settings.physical_address),
      whatToBring: settings.instructions_pre_appointment,
      whatsappNumber: settings.whatsapp_number,
    };

    const { error: resendError } = await resend.emails.send({
      from: resendFromAddress(),
      to: [booking.patient_email],
      subject: PATIENT_CONFIRM_COPY[lang].subject(bookingRef),
      html: buildPatientConfirmHtml(emailData),
    });

    if (resendError) {
      console.error("[admin/resend-confirmation] Resend error:", JSON.stringify(resendError));
      const failedAt = new Date().toISOString();
      await supabase
        .from("bookings")
        .update({
          patient_email_last_status: "failed",
          patient_email_last_attempt_at: failedAt,
        })
        .eq("id", bookingId);
      return NextResponse.json(
        {
          sent: false,
          error: "resend_failed",
          lastStatus: "failed",
          lastAttemptAt: failedAt,
          staffResendCount: nextCount,
          message: "No se pudo enviar el correo. Revisa RESEND_API_KEY / RESEND_FROM.",
        },
        { status: 502 }
      );
    }

    const sentAt = new Date().toISOString();
    await supabase
      .from("bookings")
      .update({
        patient_email_sent_at: sentAt,
        patient_email_last_status: "sent",
        patient_email_last_attempt_at: sentAt,
      })
      .eq("id", bookingId);

    console.log(
      `[admin/resend-confirmation] Sent booking ${bookingId} (${bookingRef}) staff#${nextCount}`
    );

    return NextResponse.json({
      sent: true,
      lastStatus: "sent",
      lastAttemptAt: sentAt,
      patientEmailSentAt: sentAt,
      staffResendCount: nextCount,
      maxStaffResends: STAFF_RESEND_MAX,
      cooldownMs: STAFF_RESEND_COOLDOWN_MS,
    });
  } catch (err) {
    console.error("[admin/resend-confirmation] Unexpected error:", err);
    const failedAt = new Date().toISOString();
    try {
      await supabase
        .from("bookings")
        .update({
          patient_email_last_status: "failed",
          patient_email_last_attempt_at: failedAt,
        })
        .eq("id", bookingId);
    } catch { /* best-effort */ }
    return NextResponse.json({ sent: false, error: "unexpected", lastStatus: "failed" }, { status: 500 });
  }
}
