import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn(
    "[send-patient-confirmation] RESEND_API_KEY is not set — emails will fail silently. " +
    "Add it to .env.local: RESEND_API_KEY=re_xxxxxxxxxx"
  );
}

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Payload shape sent by the booking page ────────────────────────────────────
type Lang = "es" | "en";

type PatientConfirmationPayload = {
  lang: Lang;
  patientEmail: string;
  patientName: string;
  serviceName: string;      // already in the patient's language (svcCopy.name)
  durationMinutes: number;
  priceLabel: string;       // pre-formatted with currency, e.g. "$600 MXN"
  startIso: string;         // the real UTC instant (selectedSlot.startIso) —
                             // NOT the display date/time strings, which are
                             // reconstructed from Tijuana wall-clock numbers
                             // treated as browser-local and would shift if
                             // re-converted through toISOString() here.
  bookingRef: string;
  address: string;
  mapsUrl: string;          // already resolved (real URL or search fallback)
  whatToBring: string | null; // clinic_settings.instructions_pre_appointment —
                               // single-language field (no _en column), shown
                               // as-is regardless of lang.
  whatsappNumber: string;
};

// ── Sanitise user content to prevent accidental HTML injection ────────────────
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Tijuana wall-clock date/time for display — the clinic's own timezone,
// not the patient's browser or the server's.
function formatTijuana(startIso: string, lang: Lang) {
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

function buildHtml(p: PatientConfirmationPayload): string {
  const c = COPY[p.lang];
  const { dateLabel, timeLabel } = formatTijuana(p.startIso, p.lang);

  const bringRow = p.whatToBring
    ? row(
        c.labelBring,
        p.whatToBring
          .split("\n")
          .filter(Boolean)
          .map((line) => esc(line))
          .join("<br/>"),
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

        <!-- ─── Header ─── -->
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

        <!-- ─── Intro ─── -->
        <tr>
          <td style="padding:20px 36px 0;font-family:Arial,sans-serif;font-size:13px;color:#64748B;">
            ${esc(c.intro)}
          </td>
        </tr>

        <!-- ─── Details table ─── -->
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

        <!-- ─── Cancellation ─── -->
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

        <!-- ─── Footer ─── -->
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

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PatientConfirmationPayload;

    const { lang, patientEmail, patientName, serviceName, startIso, bookingRef } = body;
    if (!lang || !patientEmail || !patientName || !serviceName || !startIso || !bookingRef) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const c = COPY[lang];

    // Best-effort: a failed confirmation email should never undo or block
    // an already-successful booking. Log and return 200 either way — the
    // caller doesn't (and shouldn't) treat this as fatal.
    const { error } = await resend.emails.send({
      from:    "Clinica Katya Heras <onboarding@resend.dev>",
      to:      [patientEmail],
      subject: c.subject(bookingRef),
      html:    buildHtml(body),
    });

    if (error) {
      console.error("[send-patient-confirmation] Resend error:", JSON.stringify(error));
      return NextResponse.json({ sent: false, error: "Failed to send email" }, { status: 200 });
    }

    console.log(`[send-patient-confirmation] Sent to ${patientEmail} for ${bookingRef}`);
    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[send-patient-confirmation] Unexpected error:", err);
    // Same reasoning: never surface this as a hard failure to the booking flow.
    return NextResponse.json({ sent: false, error: "Internal server error" }, { status: 200 });
  }
}
