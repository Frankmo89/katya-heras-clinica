import { NextResponse } from "next/server";
import { updateMarketingOutcome } from "@/lib/ai-learning";
import { requireStaffSession } from "@/lib/requireStaffSession";

export const runtime = "nodejs";

/**
 * POST /api/ai/publicidad/outcome
 * body: { eventId, leads?, bookings?, notes? }
 */
export async function POST(request: Request) {
  try {
    if (!(await requireStaffSession(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const eventId = String(body.eventId || "").trim();
    if (!eventId) {
      return NextResponse.json({ error: "Falta eventId." }, { status: 400 });
    }

    const leads =
      body.leads === undefined || body.leads === null || body.leads === ""
        ? null
        : Number(body.leads);
    const bookings =
      body.bookings === undefined ||
      body.bookings === null ||
      body.bookings === ""
        ? null
        : Number(body.bookings);
    const notes = body.notes != null ? String(body.notes) : null;

    if (leads != null && (!Number.isFinite(leads) || leads < 0)) {
      return NextResponse.json({ error: "leads inválido." }, { status: 400 });
    }
    if (bookings != null && (!Number.isFinite(bookings) || bookings < 0)) {
      return NextResponse.json(
        { error: "bookings inválido." },
        { status: 400 },
      );
    }

    const ok = await updateMarketingOutcome(eventId, {
      leads,
      bookings,
      notes,
    });
    if (!ok) {
      return NextResponse.json(
        { error: "No se pudo guardar el outcome." },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("publicidad/outcome", err);
    return NextResponse.json(
      { error: "Error al guardar outcome." },
      { status: 500 },
    );
  }
}
