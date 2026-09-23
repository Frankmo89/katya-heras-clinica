/**
 * Shared patient-confirmation email HTML + copy.
 * Used by the public once-only send route and the staff resend route.
 * Content always comes from DB-loaded fields — never from the client.
 */

export type PatientConfirmLang = "es" | "en";

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatTijuana(startIso: string, lang: PatientConfirmLang) {
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

export function formatPriceLabel(amount: number, currency: "MXN" | "USD"): string {
  const locale = currency === "MXN" ? "es-MX" : "en-US";
  const formatted = amount.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `$${formatted}\u00a0${currency}`;
}

export const PATIENT_CONFIRM_COPY = {
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

export interface PatientConfirmEmailData {
  lang: PatientConfirmLang;
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

export function buildPatientConfirmHtml(p: PatientConfirmEmailData): string {
  const c = PATIENT_CONFIRM_COPY[p.lang];
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

/** Normalize clinic maps_url into an https link (or Google Maps search). */
export function resolveMapsUrl(mapsUrl: string | null | undefined, physicalAddress: string | null | undefined): string {
  const rawMaps = (mapsUrl ?? "").trim();
  if (/^https?:\/\//i.test(rawMaps)) return rawMaps;
  const query = physicalAddress || rawMaps;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
