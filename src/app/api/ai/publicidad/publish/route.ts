import { NextResponse } from "next/server";
import { markMarketingPublished } from "@/lib/ai-learning";
import { requireStaffSession } from "@/lib/requireStaffSession";

export const runtime = "nodejs";

/**
 * POST /api/ai/publicidad/publish
 * body: { eventId, channel?, text }
 * Marks the marketing generate event as published (e.g. after Copy).
 */
export async function POST(request: Request) {
  try {
    if (!(await requireStaffSession(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const eventId = String(body.eventId || "").trim();
    const text = String(body.text || "").trim();
    const channel = body.channel ? String(body.channel).trim() : "copy";

    if (!eventId) {
      return NextResponse.json({ error: "Falta eventId." }, { status: 400 });
    }
    if (!text) {
      return NextResponse.json({ error: "Falta text." }, { status: 400 });
    }

    const ok = await markMarketingPublished(eventId, text, { channel });
    if (!ok) {
      return NextResponse.json(
        { error: "No se pudo marcar como publicado." },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("publicidad/publish", err);
    return NextResponse.json(
      { error: "Error al guardar publicación." },
      { status: 500 },
    );
  }
}
