import { NextResponse } from "next/server";
import { applyRating, type ClinicalSource } from "@/lib/ai-learning";
import { requireStaffSession } from "@/lib/requireStaffSession";

export const runtime = "nodejs";

/**
 * Route thumbs feedback to marketing vs clinical tables.
 * patient_id never goes into ML tables — audit only when clinical + patientId.
 */
export async function POST(request: Request) {
  try {
    if (!(await requireStaffSession(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const downvoted_sources: string[] | null = Array.isArray(
      body.downvoted_sources,
    )
      ? body.downvoted_sources.map(String).filter(Boolean).slice(0, 30)
      : Array.isArray(body.citationTitles)
        ? body.citationTitles.map(String).filter(Boolean).slice(0, 30)
        : null;

    const domain = source === "publicidad" ? "marketing" : "clinical";
    const clinicalSource: ClinicalSource =
      source === "osteorag" || source === "resumen_clinico"
        ? source
        : "other";

    const id = await applyRating({
      domain,
      rating: rating as 1 | -1,
      rating_note: body.note ? String(body.note) : null,
      related_event_id: body.relatedEventId
        ? String(body.relatedEventId)
        : null,
      downvoted_sources,
      citation_titles: Array.isArray(body.citationTitles)
        ? body.citationTitles.map(String).filter(Boolean)
        : downvoted_sources,
      topic_or_question: body.topicOrQuestion
        ? String(body.topicOrQuestion)
        : null,
      source: clinicalSource,
      // Audit path only — never written to ML event tables
      patient_id:
        domain === "clinical" && body.patientId
          ? String(body.patientId)
          : null,
      output_preview: body.outputPreview
        ? String(body.outputPreview).slice(0, 1500)
        : null,
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
    return NextResponse.json(
      { error: "Error al guardar feedback" },
      { status: 500 },
    );
  }
}
