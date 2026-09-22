import { NextResponse } from "next/server";
import {
  PUBLICIDAD_PROMPT_VERSION,
  groqChatWithFallback,
  logMarketingEvent,
} from "@/lib/ai-learning";
import { toneForPreset } from "@/lib/publicidadTone";
import { createClient } from "@supabase/supabase-js";
import { requireStaffSession } from "@/lib/requireStaffSession";
import { instagramHandleFromUrl } from "@/lib/clinicSettings";

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


type ClinicContact = {
  line: string;
  whatsapp: string | null;
  email: string | null;
  igHandle: string | null;
  hasContact: boolean;
};

async function clinicContact(): Promise<ClinicContact> {
  const empty: ClinicContact = {
    line: "",
    whatsapp: null,
    email: null,
    igHandle: null,
    hasContact: false,
  };
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return empty;
  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await supabase
      .from("clinic_settings")
      .select("whatsapp_number, contact_email, instagram_url, facebook_url")
      .eq("id", 1)
      .maybeSingle();
    if (!data) return empty;
    const whatsapp = String(data.whatsapp_number || "").trim() || null;
    const email = String(data.contact_email || "").trim() || null;
    const igUrl = String(data.instagram_url || "").trim() || null;
    const igHandle = instagramHandleFromUrl(igUrl);
    const facebook = String(data.facebook_url || "").trim() || null;
    const parts: string[] = [];
    if (whatsapp) parts.push(`WhatsApp: ${whatsapp}`);
    if (email) parts.push(`Email: ${email}`);
    if (igHandle) parts.push(`Instagram: ${igHandle}`);
    else if (igUrl) parts.push(`Instagram: ${igUrl}`);
    if (facebook) parts.push(`Facebook: ${facebook}`);
    return {
      line: parts.join(" · "),
      whatsapp,
      email,
      igHandle,
      hasContact: Boolean(whatsapp || email || igHandle || igUrl),
    };
  } catch {
    return empty;
  }
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
    if (!(await requireStaffSession(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const topic = String(body.topic || "").trim();
    const folderFilter = (body.folderFilter || "all") as FolderFilter;
    const tonePresetId = String(body.tone_preset || body.tonePreset || "").trim();
    const preset = toneForPreset(tonePresetId);
    const tone = String(
      body.tone || preset?.tone || "cálido, cercano, humano; sin exagerar promesas",
    ).trim();
    const resolvedPresetId = preset?.id ?? (tonePresetId || null);

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
    const contact = await clinicContact();

    const ctaRules = contact.hasContact
      ? [
          "Reglas de CTA (obligatorias):",
          contact.whatsapp
            ? `- Prefiere WhatsApp (${contact.whatsapp}) en los CTAs cuando haga falta un canal de contacto.`
            : "- No hay WhatsApp en configuración; no inventes uno.",
          !contact.whatsapp && contact.email
            ? `- Si no hay WhatsApp, usa el email (${contact.email}).`
            : "",
          !contact.whatsapp && !contact.email && contact.igHandle
            ? `- Si no hay WhatsApp ni email, usa Instagram ${contact.igHandle}.`
            : "",
          contact.igHandle
            ? `- En piezas de Instagram puedes mencionar ${contact.igHandle} (handle real).`
            : "- No hay handle de Instagram configurado; no inventes @handles.",
          "NUNCA inventes teléfonos, WhatsApp, emails ni handles (nada tipo 555-123-4567, +52 inventado, @fakes).",
        ]
          .filter(Boolean)
          .join("\n")
      : [
          "Reglas de CTA (obligatorias):",
          "- No hay contacto en Configuración: CTA suave sin inventar números.",
          '- Usa frases como "Agenda en la clínica", "Reserva en la web" o "Escríbenos por DM".',
          "- NUNCA inventes teléfonos, WhatsApp, emails ni handles (nada tipo 555-123-4567, +52 inventado, @fakes).",
        ].join("\n");

    const systemPrompt = `
Eres la estratega de marketing de la clínica Katya Heras (masaje tailandés, osteopatía holística, kinesiotape / VNM).
Trabajas SOLO con el material de estudio aportado. No inventes estudios ni cifras. No diagnostiques ni prometas curas.
Tono: ${tone}. Español de México/latam. Público: potenciales pacientes y comunidad wellness.
Contacto real de la clínica (úsalo SOLO en CTAs si hace falta): ${contact.line || "ninguno configurado — no pongas teléfono ni email"}.
${ctaRules}

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

    const { raw, model } = await groqChatWithFallback({
      apiKey: groqKey,
      temperature: 0.55,
      json: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    let pack: Record<string, unknown>;
    try {
      pack = JSON.parse(raw || "{}");
    } catch {
      return NextResponse.json(
        { error: "La IA no devolvió JSON válido de publicidad." },
        { status: 502 },
      );
    }

    const citationTitles = (corpus.citations as { title?: string }[])
      .map((c) => c?.title || "")
      .filter(Boolean);

    const outputDraft =
      typeof pack.articulo_corto === "string"
        ? JSON.stringify({
            articulo_corto: pack.articulo_corto,
            estrategia: pack.estrategia,
            instagram_post: pack.instagram_post,
            facebook_post: pack.facebook_post,
          })
        : JSON.stringify(pack).slice(0, 8000);

    const eventId = await logMarketingEvent({
      event_type: "generate",
      topic,
      folder_filter: folderFilter,
      prompt_version: PUBLICIDAD_PROMPT_VERSION,
      model,
      output_draft: outputDraft,
      citation_titles: citationTitles,
      meta: {
        has_estrategia: Boolean(pack.estrategia),
        has_ig: Boolean(pack.instagram_post),
        tone,
        tone_preset: resolvedPresetId,
        has_clinic_contact: contact.hasContact,
        ig_handle: contact.igHandle,
      },
    });

    return NextResponse.json({
      topic,
      folderFilter,
      corpusPreview: corpus.answer.slice(0, 500),
      citations: corpus.citations,
      eventId,
      model,
      prompt_version: PUBLICIDAD_PROMPT_VERSION,
      tone,
      tone_preset: resolvedPresetId,
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
