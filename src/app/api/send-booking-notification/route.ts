import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { resendFromAddress } from "@/lib/emailFrom";

if (!process.env.RESEND_API_KEY) {
  console.warn(
    "[send-booking-notification] RESEND_API_KEY is not set — emails will fail silently. " +
    "Add it to .env.local: RESEND_API_KEY=re_xxxxxxxxxx"
  );
}

const resend = new Resend(process.env.RESEND_API_KEY);

// This route used to accept clinicEmail and every display field (patient
// name, service, date, notes...) directly from the request body, with no
// server-side lookup at all — anyone could POST an arbitrary recipient and
// arbitrary content through it. clinicEmail in particular meant this was a
// fully open mail relay, not just a content-forgery risk. Now the client
// supplies only enough to look the booking up and say which lifecycle
// event fired; the recipient (clinic_settings.contact_email) and every
// displayed field come from the database.
type ActionType = "CREATE" | "CANCEL";

type RequestPayload = {
  bookingId: string;
  bookingRef: string;
  actionType: ActionType;
};

const RECENCY_MINUTES = 15;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const ACTION_CONFIG: Record<ActionType, { color: string; label: string; subText: string; subject: (n: string) => string }> = {
  CREATE: {
    color:   "#C08A5E",
    label:   "NUEVA RESERVA",
    subText: "Se acaba de registrar una nueva cita en el sistema. Aquí tienes el resumen:",
    subject: (n) => `✅ [Katya Heras] Nueva reserva · ${n}`,
  },
  CANCEL: {
    color:   "#a64b4b",
    label:   "CITA CANCELADA",
    subText: "La siguiente cita ha sido cancelada en el sistema:",
    subject: (n) => `❌ [Katya Heras] Cita cancelada · ${n}`,
  },
};

function row(label: string, value: string, shaded: boolean): string {
  const bg = shaded ? "background:#F8FAFC;" : "";
  return `
    <tr style="${bg}">
      <td style="padding:13px 16px;font-family:Arial,sans-serif;font-size:10px;
                 text-transform:uppercase;letter-spacing:0.12em;color:#C08A5E;
                 width:130px;vertical-align:top;white-space:nowrap;">
        ${label}
      </td>
      <td style="padding:13px 16px;font-family:Georgia,'Times New Roman',serif;
                 font-size:15px;color:#1E293B;line-height:1.4;">
        ${value}
      </td>
    </tr>`;
}

interface EmailData {
  actionType: ActionType;
  patientName: string;
  patientEmail: string | null;
  patientPhone: string | null;
  service: string;
  formattedDate: string;
  time: string;
  bookingRef: string;
  notes: string | null;
}

function buildHtml(p: EmailData): string {
  const action = ACTION_CONFIG[p.actionType];

  const emailRow = p.patientEmail
    ? row("Email", `<span style="font-family:Arial,sans-serif;font-size:14px;">${esc(p.patientEmail)}</span>`, false)
    : "";
  const phoneRow = p.patientPhone
    ? row("Teléfono", `<span style="font-family:Arial,sans-serif;font-size:14px;">${esc(p.patientPhone)}</span>`, !p.patientEmail)
    : "";
  const notesRow = p.notes
    ? row("Notas", `<span style="font-family:Arial,sans-serif;font-size:14px;color:#64748B;font-style:italic;">${esc(p.notes)}</span>`, true)
    : "";
  const refShaded = !p.notes && !p.patientPhone;
  const refRow = row("Referencia", `<span style="font-family:'Courier New',monospace;font-size:12px;color:#94A3B8;">${esc(p.bookingRef)}</span>`, refShaded);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Nueva cita · Katya Heras</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:36px 16px;">
    <tr><td align="center">

      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border:1px solid #E2E8F0;border-radius:16px;
                    overflow:hidden;max-width:560px;width:100%;">

        <tr>
          <td style="background:${action.color};padding:28px 36px;">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;
                      text-transform:uppercase;letter-spacing:0.25em;
                      color:rgba(255,255,255,0.70);">${action.label}</p>
            <p style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;
                      font-size:26px;font-weight:normal;color:#ffffff;">
              ${esc(p.patientName)}
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 36px 0;font-family:Arial,sans-serif;font-size:13px;
                     color:#64748B;">
            ${action.subText}
          </td>
        </tr>

        <tr>
          <td style="padding:20px 36px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
              ${row("Servicio",    esc(p.service),                                                                                       false)}
              ${row("Fecha",       `${esc(p.formattedDate)} &middot; ${esc(p.time)}&thinsp;h`,                                             true)}
              ${emailRow}
              ${phoneRow}
              ${notesRow}
              ${refRow}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:18px 36px;background:#F8FAFC;border-top:1px solid #E2E8F0;">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#94A3B8;">
              Sistema de reservas · Katya Heras Clínica de Osteopatía
            </p>
          </td>
        </tr>

      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (!rateLimit(`send-booking-notification:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: RequestPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { bookingId, bookingRef, actionType } = body;
  if (!bookingId || !bookingRef || (actionType !== "CREATE" && actionType !== "CANCEL")) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Same atomic-claim idiom as send-patient-confirmation: only a request
  // that flips its own claim column from null to now() proceeds. CREATE
  // additionally requires the booking to be recent (guards against
  // replaying a very old booking's create-notification); CANCEL instead
  // requires the booking to actually be cancelled right now — it can't be
  // recency-gated against created_at, since a real cancellation can happen
  // long after creation, and there's no separate cancelled_at column to
  // gate on instead. Either way, the claim can only ever succeed once per
  // booking per action type, so the DB itself is what proves the action
  // being reported actually happened — not the client's say-so.
  const claimColumn = actionType === "CREATE" ? "clinic_notified_created_at" : "clinic_notified_cancelled_at";
  let query = supabase
    .from("bookings")
    .update({ [claimColumn]: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("booking_ref", bookingRef)
    .is(claimColumn, null);

  if (actionType === "CREATE") {
    const recencyCutoff = new Date(Date.now() - RECENCY_MINUTES * 60 * 1000).toISOString();
    query = query.gt("created_at", recencyCutoff);
  } else {
    query = query.eq("status", "cancelled");
  }

  const { data: claimed, error: claimError } = await query
    .select("patient_name, patient_email, patient_phone, service_id, date, time, notes")
    .maybeSingle();

  if (claimError) {
    console.error("[send-booking-notification] Claim query error:", claimError.message);
  }
  if (!claimed) {
    // Not found, already sent for this action type, too old (CREATE), or
    // not actually cancelled yet (CANCEL) — same response either way, so
    // this can't be used to probe which (bookingId, bookingRef) are valid.
    return NextResponse.json({ sent: false });
  }

  try {
    const { data: settings } = await supabase
      .from("clinic_settings")
      .select("contact_email")
      .eq("id", 1)
      .single();
    const clinicEmail = settings?.contact_email;
    if (!clinicEmail) {
      console.error("[send-booking-notification] No contact_email on file — cannot send.");
      await supabase
        .from("bookings")
        .update({ [claimColumn]: null })
        .eq("id", bookingId)
        .eq("booking_ref", bookingRef);
      return NextResponse.json({ sent: false });
    }

    const { data: svc } = await supabase
      .from("services")
      .select("title_es")
      .eq("id", claimed.service_id)
      .maybeSingle();

    const [y, m, d] = claimed.date.split("-").map(Number);
    const formattedDate = new Date(y, m - 1, d).toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const emailData: EmailData = {
      actionType,
      patientName:  claimed.patient_name,
      patientEmail: claimed.patient_email,
      patientPhone: claimed.patient_phone,
      service:      svc?.title_es ?? claimed.service_id,
      formattedDate,
      time:         claimed.time,
      bookingRef,
      notes:        claimed.notes,
    };

    const { error } = await resend.emails.send({
      from:    resendFromAddress(),
      to:      [clinicEmail],
      subject: ACTION_CONFIG[actionType].subject(claimed.patient_name),
      html:    buildHtml(emailData),
    });

    if (error) {
      console.error("[send-booking-notification] Resend error:", JSON.stringify(error));
      await supabase
        .from("bookings")
        .update({ [claimColumn]: null })
        .eq("id", bookingId)
        .eq("booking_ref", bookingRef);
      return NextResponse.json({ sent: false, error: "resend_failed" });
    }

    console.log(`[send-booking-notification] Email (${actionType}) sent for booking ${bookingId} (${bookingRef})`);
    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[send-booking-notification] Unexpected error:", err);
    try {
      await supabase
        .from("bookings")
        .update({ [claimColumn]: null })
        .eq("id", bookingId)
        .eq("booking_ref", bookingRef);
    } catch { /* best-effort release */ }
    return NextResponse.json({ sent: false });
  }
}
