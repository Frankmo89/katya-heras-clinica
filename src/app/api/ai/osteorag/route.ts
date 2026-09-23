import { NextResponse } from "next/server";
import {
  OSTEORAG_PROMPT_VERSION,
  logClinicalAudit,
  logClinicalEvent,
} from "@/lib/ai-learning";
import {
  getOsteoAuthHeaders,
  invalidateOsteoAuthCache,
} from "@/lib/osteoragClient";
import { requireStaffSession } from "@/lib/requireStaffSession";

export const runtime = "nodejs";

type FolderFilter = "escuela" | "libros" | "tesis" | "all";

interface Citation {
  title: string;
  page: number | null;
  source_folder: string;
  excerpt: string;
}

export async function POST(request: Request) {
  try {
    if (!(await requireStaffSession(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const question = String(body.question || "").trim();
    const patientContext = String(body.patientContext || "").trim();
    const folderFilter = (body.folderFilter || "all") as FolderFilter;
    const patientId = body.patientId ? String(body.patientId) : null;

    if (!question) {
      return NextResponse.json({ error: "Escribe una pregunta." }, { status: 400 });
    }
    if (question.length > 2000) {
      return NextResponse.json({ error: "Pregunta demasiado larga." }, { status: 400 });
    }

    const auth = await getOsteoAuthHeaders();
    if (!auth.ok) {
      // Security: never return env key presence (`present`) to the client.
      return NextResponse.json(
        {
          error: auth.error,
          code: "OSTEORAG_AUTH",
        },
        { status: auth.status },
      );
    }
    const { base, headers } = auth;

    // Only clinical context goes to the external corpus service — never the
    // patient's name (or email/phone).
    const message = [
      "Eres un asistente de estudio osteopático con corpus citado.",
      "NO diagnostiques ni prescribas. Responde solo con evidencia del corpus.",
      patientContext
        ? `Notas de contexto clínico (orientación de búsqueda, no como diagnóstico):\n${patientContext.slice(0, 1200)}`
        : "",
      `Pregunta de la terapeuta:\n${question}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const upstream = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message, folderFilter }),
    });

    const text = await upstream.text();
    let json: { answer?: string; citations?: Citation[]; error?: string } = {};
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: `OsteoRAG respondió ${upstream.status} sin JSON válido.` },
        { status: 502 },
      );
    }

    if (!upstream.ok) {
      if (upstream.status === 401) invalidateOsteoAuthCache();
      return NextResponse.json(
        { error: json.error || `OsteoRAG error ${upstream.status}` },
        { status: upstream.status === 401 ? 401 : 502 },
      );
    }

    const citationTitles = (json.citations || [])
      .map((c) =>
        c && typeof c === "object" && "title" in c
          ? String((c as { title?: string }).title || "")
          : "",
      )
      .filter(Boolean);

    const eventId = await logClinicalEvent({
      source: "osteorag",
      event_type: "query",
      topic_or_question: question,
      folder_filter: folderFilter,
      prompt_version: OSTEORAG_PROMPT_VERSION,
      model: "osteorag-worker",
      output_draft: json.answer || "",
      citation_titles: citationTitles,
      meta: { has_patient_context: Boolean(patientContext) },
    });

    if (patientId && eventId) {
      await logClinicalAudit({
        patient_id: patientId,
        clinical_event_id: eventId,
        source: "osteorag",
        note: "consulta corpus",
        meta: { folder_filter: folderFilter },
      });
    }

    return NextResponse.json({
      answer: json.answer || "",
      citations: json.citations || [],
      eventId,
      prompt_version: OSTEORAG_PROMPT_VERSION,
      disclaimer:
        "Asistente de estudio con citas del corpus. No es diagnóstico ni sustituye el criterio clínico.",
    });
  } catch (err) {
    console.error("osteorag proxy", err);
    return NextResponse.json(
      { error: "Error al consultar OsteoRAG." },
      { status: 500 },
    );
  }
}
