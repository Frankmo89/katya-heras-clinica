import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn(
    "[send-booking-notification] RESEND_API_KEY is not set — emails will fail silently. " +
    "Add it to .env.local: RESEND_API_KEY=re_xxxxxxxxxx"
  );
}

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Payload shape sent by the booking page ────────────────────────────────────
type ActionType = "CREATE" | "CANCEL" | "MODIFY";

type BookingNotificationPayload = {
  actionType?: ActionType;
  patientName: string;
  patientEmail?: string | null;
  patientPhone?: string | null;
  service: string;
  date: string;   // "YYYY-MM-DD"
  time: string;   // "HH:MM"
  bookingRef?: string | null;
  clinicEmail: string;
  notes?: string;
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

// ── Per-action visual config ──────────────────────────────────────────────────
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
  MODIFY: {
    color:   "#5a7fa3",
    label:   "CITA MODIFICADA",
    subText: "Los datos de la siguiente cita han sido actualizados:",
    subject: (n) => `✏️ [Katya Heras] Cita modificada · ${n}`,
  },
};

// ── Table row helper ──────────────────────────────────────────────────────────
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

// ── HTML email builder ────────────────────────────────────────────────────────
function buildHtml(p: BookingNotificationPayload, formattedDate: string): string {
  const action = ACTION_CONFIG[p.actionType ?? "CREATE"];

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
  const refRow = p.bookingRef
    ? row("Referencia", `<span style="font-family:'Courier New',monospace;font-size:12px;color:#94A3B8;">${esc(p.bookingRef)}</span>`, refShaded)
    : "";

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

        <!-- ─── Header ─── -->
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

        <!-- ─── Sub-header label ─── -->
        <tr>
          <td style="padding:20px 36px 0;font-family:Arial,sans-serif;font-size:13px;
                     color:#64748B;">
            ${action.subText}
          </td>
        </tr>

        <!-- ─── Details table ─── -->
        <tr>
          <td style="padding:20px 36px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
              ${row("Servicio",    esc(p.service),                                                                                       false)}
              ${row("Fecha",       `${esc(formattedDate)} &middot; ${esc(p.time)}&thinsp;h`,                                             true)}
              ${emailRow}
              ${phoneRow}
              ${notesRow}
              ${refRow}
            </table>
          </td>
        </tr>

        <!-- ─── Footer ─── -->
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

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BookingNotificationPayload;

    // Validate required fields
    const { patientName, service, date, time, clinicEmail } = body;
    if (!patientName || !service || !date || !time || !clinicEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Format the date for a human-readable display
    const [y, m, d] = date.split("-").map(Number);
    const formattedDate = new Date(y, m - 1, d).toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const { error } = await resend.emails.send({
      from:    "Clinica Katya Heras <onboarding@resend.dev>",
      to:      [clinicEmail],
      subject: ACTION_CONFIG[body.actionType ?? "CREATE"].subject(patientName),
      html:    buildHtml(body, formattedDate),
    });

    if (error) {
      console.error("[send-booking-notification] Resend error:", JSON.stringify(error));
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    console.log(`[send-booking-notification] Email (${body.actionType ?? "CREATE"}) sent to ${clinicEmail} for ${patientName}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send-booking-notification] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
