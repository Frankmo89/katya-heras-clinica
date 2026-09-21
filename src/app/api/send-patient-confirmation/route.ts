import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { rateLimit, clientIp } from "@/lib/rateLimit";

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

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTijuana(startIso: string, lang: "es" | "en") {
  const d = new Date(startIso);
  const dateLabel = new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", {
    timeZone: "America/Tijuana",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
  const timeLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Tijuana",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return { dateLabel, timeLabel };
}

function formatPriceLabel(amount: number, currency: "MXN" | "USD"): string {
  const locale = currency === "MXN" ? "es-MX" : "en-US";
  const formatted = amount.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return `$${formatted} ${currency}`;
}

const COPY = {
  es: {
    subject: (ref: string) => `Tu cita está confirmada · ${ref}`,
    preheader: "Aquí tienes los detalles de tu sesión.",
    greeting: (name: string) => `Hola ${name},`,
    intro: "Tu cita quedó confirmada. Aquí tienes todos los detalles:",
    labelService: "Servicio",
    labelWhen: "Fecha y hora",
    whenSuffix: "h · hora de Tijuana",
    labelWhere: "Dirección",
    openMaps: "Abrir en Google Maps",
    labelBring: "Qué traer",
    labelCancel: "¿Necesitas cambiar o cancelar?",
    cancelBody: (whatsapp: string) =>
      `Puedes mover o cancelar tu cita hasta 24 horas antes sin costo. Escríbenos por WhatsApp o llámanos al ${whatsapp} con tu número de referencia.`,
    refLabel: "Referencia",
    footer: "Katya Heras Clínica de Osteopatía",
  },
  en: {
    subject: (ref: string) => `Your appointment is confirmed · ${ref}`,
    preheader: "Here are your session details.",
    greeting: (name: string) => `Hi ${name},`,
    intro: "Your appointment is confirmed. Here are the details:",
    labelService: "Service",
    labelWhen: "Date & time",
    whenSuffix: "· Tijuana time",
    labelWhere: "Address",
    openMaps: "Open in Google Maps",
    labelBring: "What to bring",
    labelCancel: "Need to change or cancel?",
    cancelBody: (whatsapp: string) =>
      `You can move or cancel your appointment up to 24 hours ahead at no cost. Message us on WhatsApp or call ${whatsapp} with your reference number.`,
    refLabel: "Reference",
    footer: "Katya Heras Osteopathy Clinic",
  },
} as const;

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
  lang: "es" | "en";
  patientName: string;
  serviceName: string;
  durationMinutes: number;
  priceLabel: string;
  startIso: string;
  bookingRef: string;
  address: string;
  mapsUrl: string;
  whatToBring: string | null;
  whatsappNumber: string;
}

function buildHtml(p: EmailData): string {
  const c = COPY[p.lang];
  const { dateLabel, timeLabel } = formatTijuana(p.startIso, p.lang);

  const bringRow = p.whatToBring
    ? row(
        c.labelBring,
        p.whatToBring.split("\n").filter(Boolean).map((line) => esc(line)).join("<br/>"),
        true
      )
    : "";

  return `<!DOCTYPE html>
<html lang="${p.lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${esc(c.subject(p.bookingRef))}</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;">
  <span style="display:none;max-height:0;overflow:hidden;">${esc(c.preheader)}</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:36px 16px;">
    <tr><td align="center">

      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border:1px solid #E2E8F0;border-radius:16px;
                    overflow:hidden;max-width:560px;width:100%;">

        <tr>
          <td style="background:#C08A5E;padding:28px 36px;">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;
                      text-transform:uppercase;letter-spacing:0.25em;
                      color:rgba(255,255,255,0.70);">${esc(c.refLabel)}: ${esc(p.bookingRef)}</p>
            <p style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;
                      font-size:26px;font-weight:normal;color:#ffffff;">
              ${esc(c.greeting(p.patientName))}
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 36px 0;font-family:Arial,sans-serif;font-size:13px;color:#64748B;">
            ${esc(c.intro)}
          </td>
        </tr>

        <tr>
          <td style="padding:20px 36px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
              ${row(c.labelService, `${esc(p.serviceName)} &middot; ${p.durationMinutes}&thinsp;min &middot; ${esc(p.priceLabel)}`, false)}
              ${row(c.labelWhen, `${esc(dateLabel)}<br/>${esc(timeLabel)}&thinsp;${esc(c.whenSuffix)}`, true)}
              ${row(
                c.labelWhere,
                `${esc(p.address)}<br/><a href="${p.mapsUrl}" style="color:#C08A5E;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;">${esc(c.openMaps)} &rarr;</a>`,
                false
              )}
              ${bringRow}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:8px 36px 28px;">
            <div style="background:rgba(192,138,94,0.08);border-radius:12px;padding:16px 20px;">
              <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;
                        text-transform:uppercase;letter-spacing:0.1em;color:#B07A4E;">
                ${esc(c.labelCancel)}
              </p>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#1E293B;line-height:1.5;">
                ${esc(c.cancelBody(p.whatsappNumber))}
              </p>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:18px 36px;background:#F8FAFC;border-top:1px solid #E2E8F0;">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#94A3B8;">
              ${esc(c.footer)}
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
  const lang: "es" | "en" = body.lang === "en" ? "en" : "es";
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
  const { data: claimed, error: claimError } = await supabase
    .from("bookings")
    .update({ patient_email_sent_at: new Date().toISOString() })
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
      return NextResponse.json({ sent: false });
    }

    const serviceName = (lang === "es" ? svc.title_es : svc.title_en) ?? svc.title_es;
    const mapsUrl =
      (settings.maps_url ?? "").trim() ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.physical_address)}`;

    const emailData: EmailData = {
      lang,
      patientName: claimed.patient_name,
      serviceName,
      durationMinutes: svc.duration_minutes ?? 60,
      priceLabel: formatPriceLabel(Number(svc.price ?? 0), settings.currency as "MXN" | "USD"),
      startIso: claimed.starts_at,
      bookingRef,
      address: settings.physical_address,
      mapsUrl,
      whatToBring: settings.instructions_pre_appointment,
      whatsappNumber: settings.whatsapp_number,
    };

    const { error } = await resend.emails.send({
      from:    "Clinica Katya Heras <onboarding@resend.dev>",
      to:      [claimed.patient_email],
      subject: COPY[lang].subject(bookingRef),
      html:    buildHtml(emailData),
    });

    if (error) {
      console.error("[send-patient-confirmation] Resend error:", JSON.stringify(error));
      return NextResponse.json({ sent: false });
    }

    console.log(`[send-patient-confirmation] Sent to booking ${bookingId} (${bookingRef})`);
    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[send-patient-confirmation] Unexpected error:", err);
    return NextResponse.json({ sent: false });
  }
}
