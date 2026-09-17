import { NextResponse } from "next/server";

export const runtime = "nodejs";

type FolderFilter = "escuela" | "libros" | "tesis" | "all";

interface Citation {
  title: string;
  page: number | null;
  source_folder: string;
  excerpt: string;
}

/** Simple in-memory token cache (warm serverless instances). */
let cached: { token: string; expMs: number; email: string } | null = null;

function env(name: string): string {
  // Dynamic key access — avoid build-time inlining of missing secrets
  return String(process.env[name] ?? "").trim();
}

function envDiag() {
  const keys = Object.keys(process.env);
  return {
    OSTEORAG_EMAIL: Boolean(env("OSTEORAG_EMAIL")),
    OSTEORAG_PASSWORD: Boolean(env("OSTEORAG_PASSWORD")),
    OSTEORAG_BEARER_TOKEN: Boolean(env("OSTEORAG_BEARER_TOKEN")),
    OSTEORAG_BASIC_USER: Boolean(env("OSTEORAG_BASIC_USER")),
    OSTEORAG_BASIC_PASS: Boolean(env("OSTEORAG_BASIC_PASS")),
    OSTEORAG_BASE_URL: Boolean(env("OSTEORAG_BASE_URL")),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(env("NEXT_PUBLIC_SUPABASE_URL")),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(env("SUPABASE_SERVICE_ROLE_KEY")),
    GROQ_API_KEY: Boolean(env("GROQ_API_KEY")),
    envKeyCount: keys.length,
    osteoKeyNames: keys.filter((k) => /osteo/i.test(k)),
  };
}

async function getOsteoBearer(base: string): Promise<
  | { ok: true; token: string }
  | { ok: false; error: string; status: number; present: ReturnType<typeof envDiag> }
> {
  const email = env("OSTEORAG_EMAIL");
  const password = env("OSTEORAG_PASSWORD");
  const bearerDirect = env("OSTEORAG_BEARER_TOKEN");
  const basicUser = env("OSTEORAG_BASIC_USER");
  const basicPass = env("OSTEORAG_BASIC_PASS");

  if (bearerDirect) return { ok: true, token: bearerDirect };

  if (email && password) {
    if (
      cached &&
      cached.email === email &&
      cached.expMs > Date.now() + 60_000
    ) {
      return { ok: true, token: cached.token };
    }

    const cfgRes = await fetch(`${base}/api/config`, {
      headers: { Accept: "application/json", "User-Agent": "KatyaClinica/1.0" },
      cache: "no-store",
    });
    if (!cfgRes.ok) {
      return {
        ok: false,
        error: `No pude leer /api/config de OsteoRAG (${cfgRes.status}).`,
        status: 502,
        present: envDiag(),
      };
    }
    const cfg = (await cfgRes.json()) as {
      supabaseUrl?: string;
      supabaseAnonKey?: string;
    };
    const supabaseUrl = (cfg.supabaseUrl || "").replace(/\/$/, "");
    const anon = cfg.supabaseAnonKey || "";
    if (!supabaseUrl || !anon) {
      return {
        ok: false,
        error: "OsteoRAG /api/config no devolvió supabaseUrl/anon key.",
        status: 502,
        present: envDiag(),
      };
    }

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
      error_description?: string;
      msg?: string;
      error?: string;
    };
    if (!authRes.ok || !authJson.access_token) {
      return {
        ok: false,
        error:
          authJson.error_description ||
          authJson.msg ||
          authJson.error ||
          "Login OsteoRAG falló (email/password).",
        status: 401,
        present: envDiag(),
      };
    }

    const expiresIn = Number(authJson.expires_in || 3600);
    cached = {
      token: authJson.access_token,
      email,
      expMs: Date.now() + expiresIn * 1000,
    };
    return { ok: true, token: authJson.access_token };
  }

  if (basicUser && basicPass) {
    return {
      ok: true,
      token: `basic:${Buffer.from(`${basicUser}:${basicPass}`).toString("base64")}`,
    };
  }

  return {
    ok: false,
    error:
      "OsteoRAG no está configurado. En Vercel pon OSTEORAG_EMAIL + OSTEORAG_PASSWORD (login de OsteoRAG).",
    status: 503,
    present: envDiag(),
  };
}

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

    const base = (
      env("OSTEORAG_BASE_URL") || "https://osteorag.alonsosky617.workers.dev"
    ).replace(/\/$/, "");

    const auth = await getOsteoBearer(base);
    if (!auth.ok) {
      return NextResponse.json(
        {
          error: auth.error,
          code: "OSTEORAG_AUTH",
          present: auth.present,
        },
        { status: auth.status },
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "KatyaClinica/1.0",
    };
    if (auth.token.startsWith("basic:")) {
      headers.Authorization = `Basic ${auth.token.slice("basic:".length)}`;
    } else {
      headers.Authorization = `Bearer ${auth.token}`;
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
      if (upstream.status === 401) cached = null;
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
