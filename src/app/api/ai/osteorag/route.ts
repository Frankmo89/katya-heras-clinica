import { NextResponse } from "next/server";

export const runtime = "nodejs";

type FolderFilter = "escuela" | "libros" | "tesis" | "all";

interface Citation {
  title: string;
  page: number | null;
  source_folder: string;
  excerpt: string;
}

/**
 * Proxies Katya admin → OsteoRAG Worker chat.
 * Auth: server-side Basic (OSTEORAG_BASIC_USER/PASS) or Bearer (OSTEORAG_BEARER_TOKEN).
 * Never expose those secrets to the browser.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = String(body.question || "").trim();
    const patientName = String(body.patientName || "").trim();
    const patientContext = String(body.patientContext || "").trim();
    const folderFilter = (body.folderFilter || "all") as FolderFilter;

    if (!question) {
      return NextResponse.json({ error: "Escribe una pregunta." }, { status: 400 });
    }
    if (question.length > 2000) {
      return NextResponse.json({ error: "Pregunta demasiado larga." }, { status: 400 });
    }

    const base = (process.env.OSTEORAG_BASE_URL || "https://osteorag.alonsosky617.workers.dev").replace(
      /\/$/,
      "",
    );

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const bearer = (process.env.OSTEORAG_BEARER_TOKEN || "").trim();
    const basicUser = (process.env.OSTEORAG_BASIC_USER || "").trim();
    const basicPass = (process.env.OSTEORAG_BASIC_PASS || "").trim();

    if (bearer) {
      headers.Authorization = `Bearer ${bearer}`;
    } else if (basicUser && basicPass) {
      headers.Authorization =
        "Basic " + Buffer.from(`${basicUser}:${basicPass}`).toString("base64");
    } else {
      return NextResponse.json(
        {
          error:
            "OsteoRAG no está configurado en el servidor. Falta OSTEORAG_BEARER_TOKEN o OSTEORAG_BASIC_USER/PASS en Vercel.",
          code: "OSTEORAG_NOT_CONFIGURED",
        },
        { status: 503 },
      );
    }

    const message = [
      "Eres un asistente de estudio osteopático con corpus citado.",
      "NO diagnostiques ni prescribas. Responde solo con evidencia del corpus.",
      patientName
        ? `La terapeuta consulta en contexto de la paciente/paciente «${patientName}».`
        : "",
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
      return NextResponse.json(
        { error: json.error || `OsteoRAG error ${upstream.status}` },
        { status: upstream.status === 401 ? 401 : 502 },
      );
    }

    return NextResponse.json({
      answer: json.answer || "",
      citations: json.citations || [],
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
