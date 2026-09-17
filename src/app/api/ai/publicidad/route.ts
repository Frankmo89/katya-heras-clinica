import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { logLearningEvent } from "@/lib/ai-learning";

export const runtime = "nodejs";
export const maxDuration = 60;

type FolderFilter = "escuela" | "libros" | "tesis" | "all";

function env(name: string): string {
  return String(process.env[name] ?? "").trim();
}

let cached: { token: string; expMs: number; email: string } | null = null;

async function osteoBearer(base: string): Promise<string | null> {
  const email = env("OSTEORAG_EMAIL");
  const password = env("OSTEORAG_PASSWORD");
  const bearerDirect = env("OSTEORAG_BEARER_TOKEN");
  if (bearerDirect) return bearerDirect;
  if (!email || !password) return null;

  if (cached && cached.email === email && cached.expMs > Date.now() + 60_000) {
    return cached.token;
  }

  const cfgRes = await fetch(`${base}/api/config`, {
    headers: { Accept: "application/json", "User-Agent": "KatyaClinica/1.0" },
    cache: "no-store",
  });
  if (!cfgRes.ok) return null;
  const cfg = (await cfgRes.json()) as {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
  };
  const supabaseUrl = (cfg.supabaseUrl || "").replace(/\/$/, "");
  const anon = cfg.supabaseAnonKey || "";
  if (!supabaseUrl || !anon) return null;

  const authRes = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        "User-Agent": "KatyaClinica/1.0",
      },
      body: JSON.stringify({ email, password }),
    },
  );
  const authJson = (await authRes.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!authRes.ok || !authJson.access_token) return null;
  cached = {
    token: authJson.access_token,
    email,
    expMs: Date.now() + Number(authJson.expires_in || 3600) * 1000,
  };
  return authJson.access_token;
}

async function askCorpus(
  base: string,
  token: string,
  topic: string,
  folderFilter: FolderFilter,
): Promise<{ answer: string; citations: unknown[] }> {
  const message = [
    "Eres un asistente de estudio osteopático / masaje / kinesiotape con corpus citado.",
    "NO diagnostiques ni inventes. Extrae hechos útiles, definiciones, tips seguros de autocuidado en casa, curiosidades ancladas al material.",
    `Tema: ${topic}`,
    "Devuelve un resumen denso con: qué es, beneficios generales (sin promesas médicas), datos curiosos del material, y 2–4 ideas de cosas suaves para hacer en casa si el corpus lo permite.",
    "Si no hay suficiente material, dilo.",
  ].join("\n\n");

  const upstream = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "KatyaClinica/1.0",
    },
    body: JSON.stringify({ message, folderFilter }),
  });
  const json = (await upstream.json()) as {
    answer?: string;
    citations?: unknown[];
    error?: string;
  };
  if (!upstream.ok) {
    throw new Error(json.error || `OsteoRAG ${upstream.status}`);
  }
  return { answer: json.answer || "", citations: json.citations || [] };
}

/**
 * Publicidad: corpus (OsteoRAG) → estrategia + piezas redes (Groq).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = String(body.topic || "").trim();
    const folderFilter = (body.folderFilter || "all") as FolderFilter;
    const tone = String(body.tone || "cálido, profesional, cercano").trim();

    if (!topic || topic.length < 3) {
      return NextResponse.json(
        { error: "Escribe un tema (ej. osteopatía visceral)." },
        { status: 400 },
      );
    }
    if (topic.length > 200) {
      return NextResponse.json({ error: "Tema demasiado largo." }, { status: 400 });
    }

    const groqKey = env("GROQ_API_KEY");
    if (!groqKey) {
      return NextResponse.json(
        { error: "Falta GROQ_API_KEY en el servidor." },
        { status: 503 },
      );
    }

    const base = (
      env("OSTEORAG_BASE_URL") || "https://osteorag.alonsosky617.workers.dev"
    ).replace(/\/$/, "");
    const token = await osteoBearer(base);
    if (!token) {
      return NextResponse.json(
        {
          error:
            "OsteoRAG no configurado (OSTEORAG_EMAIL + OSTEORAG_PASSWORD).",
        },
        { status: 503 },
      );
    }

    const corpus = await askCorpus(base, token, topic, folderFilter);

    const groq = new Groq({ apiKey: groqKey });
    const systemPrompt = `
Eres la estratega de marketing de la clínica Katya Heras (masaje tailandés, osteopatía holística, kinesiotape / VNM).
Trabajas SOLO con el material de estudio aportado. No inventes estudios ni cifras. No diagnostiques ni prometas curas.
Tono: ${tone}. Español de México/latam. Público: potenciales pacientes y comunidad wellness.

Devuelve JSON estricto con:
- "estrategia": { "objetivo": string, "angulo": string, "publico": string, "calendario_sugerido": string[] (3–5 ideas de posts en la semana) }
- "articulo_corto": string (120–180 palabras, estilo blog/newsletter de clínica)
- "datos_curiosos": string[] (3–5, anclados al material; si no hay, array vacío)
- "tips_en_casa": string[] (2–4 tips suaves de autocuidado / hábitos; sin riesgo; si el material no alcanza, array vacío)
- "instagram_historia": { "texto_pantalla": string (máx ~90 caracteres), "texto_apoyo": string (1–2 líneas), "cta": string }
- "instagram_post": { "caption": string, "hashtags": string[] (8–12), "idea_visual": string }
- "facebook_post": { "texto": string (más largo y conversacional), "cta": string }
- "disclaimer": string (una línea: no sustituye consulta profesional)

Responde SOLO JSON válido.
`;

    const userPrompt = `Tema: ${topic}

Material del corpus (con citas implícitas en el texto):
${corpus.answer.slice(0, 6000)}

Citas disponibles (títulos): ${JSON.stringify(
      (corpus.citations as { title?: string }[])
        .map((c) => c.title)
        .filter(Boolean)
        .slice(0, 12),
    )}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.55,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let pack: Record<string, unknown>;
    try {
      pack = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "La IA no devolvió JSON válido de publicidad." },
        { status: 502 },
      );
    }

    const citationTitles = (corpus.citations as { title?: string }[])
      .map((c) => c?.title || "")
      .filter(Boolean);
    const eventId = await logLearningEvent({
      source: "publicidad",
      event_type: "generate",
      topic_or_question: topic,
      folder_filter: folderFilter,
      output_preview:
        typeof pack.articulo_corto === "string"
          ? pack.articulo_corto
          : JSON.stringify(pack).slice(0, 800),
      citation_titles: citationTitles,
      meta: {
        has_estrategia: Boolean(pack.estrategia),
        has_ig: Boolean(pack.instagram_post),
      },
    });

    return NextResponse.json({
      topic,
      folderFilter,
      corpusPreview: corpus.answer.slice(0, 500),
      citations: corpus.citations,
      eventId,
      ...pack,
    });
  } catch (err) {
    console.error("publicidad", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Error al generar la publicidad.",
      },
      { status: 500 },
    );
  }
}
