import { NextResponse } from "next/server";
import { logLearningEvent } from "@/lib/ai-learning";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rating = Number(body.rating);
    if (rating !== 1 && rating !== -1) {
      return NextResponse.json(
        { error: "rating debe ser 1 o -1" },
        { status: 400 },
      );
    }
    const source = String(body.source || "feedback");
    const allowed = ["osteorag", "publicidad", "resumen_clinico", "feedback"];
    if (!allowed.includes(source)) {
      return NextResponse.json({ error: "source inválido" }, { status: 400 });
    }

    const id = await logLearningEvent({
      source: source as "osteorag" | "publicidad" | "resumen_clinico" | "feedback",
      event_type: "rating",
      rating: rating as 1 | -1,
      rating_note: body.note ? String(body.note) : null,
      topic_or_question: body.topicOrQuestion
        ? String(body.topicOrQuestion)
        : null,
      patient_id: body.patientId ? String(body.patientId) : null,
      related_event_id: body.relatedEventId
        ? String(body.relatedEventId)
        : null,
      output_preview: body.outputPreview
        ? String(body.outputPreview).slice(0, 1500)
        : null,
      meta: {
        ui: "thumbs",
      },
    });

    if (!id) {
      return NextResponse.json(
        { error: "No se pudo guardar el feedback" },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("feedback", err);
    return NextResponse.json({ error: "Error al guardar feedback" }, { status: 500 });
  }
}
