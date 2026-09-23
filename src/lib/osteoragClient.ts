/**
 * Shared OsteoRAG Worker client (auth + optional feedback forward).
 * Server-side only — never import from client components.
 */

const DEFAULT_BASE = "https://osteorag.alonsosky617.workers.dev";
const USER_AGENT = "KatyaClinica/1.0";

/** Simple in-memory token cache (warm serverless instances). */
let cached: { token: string; expMs: number; email: string } | null = null;

function env(name: string): string {
  // Dynamic key access — avoid build-time inlining of missing secrets
  return String(process.env[name] ?? "").trim();
}

/** Official Worker URL — keep in sync with docs/OSTEORAG_CONNECTION.md. */
export function getOsteoBase(): string {
  return (env("OSTEORAG_BASE_URL") || DEFAULT_BASE).replace(/\/$/, "");
}

/** Drop cached JWT (e.g. after upstream 401). */
export function invalidateOsteoAuthCache(): void {
  cached = null;
}

/** Server-side only — never include in client JSON responses. */
function logEnvPresence() {
  console.warn("osteorag env presence", {
    OSTEORAG_EMAIL: Boolean(env("OSTEORAG_EMAIL")),
    OSTEORAG_PASSWORD: Boolean(env("OSTEORAG_PASSWORD")),
    OSTEORAG_BEARER_TOKEN: Boolean(env("OSTEORAG_BEARER_TOKEN")),
    OSTEORAG_BASIC_USER: Boolean(env("OSTEORAG_BASIC_USER")),
    OSTEORAG_BASIC_PASS: Boolean(env("OSTEORAG_BASIC_PASS")),
    OSTEORAG_BASE_URL: Boolean(env("OSTEORAG_BASE_URL")),
  });
}

export type OsteoBearerResult =
  | { ok: true; token: string }
  | { ok: false; error: string; status: number };

/**
 * Resolve Worker auth: BEARER env, or EMAIL/PASSWORD via /api/config +
 * Supabase password grant, or legacy Basic.
 */
export async function getOsteoBearer(
  base: string = getOsteoBase(),
): Promise<OsteoBearerResult> {
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
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      cache: "no-store",
    });
    if (!cfgRes.ok) {
      logEnvPresence();
      return {
        ok: false,
        error: `No pude leer /api/config de OsteoRAG (${cfgRes.status}).`,
        status: 502,
      };
    }
    const cfg = (await cfgRes.json()) as {
      supabaseUrl?: string;
      supabaseAnonKey?: string;
    };
    const supabaseUrl = (cfg.supabaseUrl || "").replace(/\/$/, "");
    const anon = cfg.supabaseAnonKey || "";
    if (!supabaseUrl || !anon) {
      logEnvPresence();
      return {
        ok: false,
        error: "OsteoRAG /api/config no devolvió supabaseUrl/anon key.",
        status: 502,
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
          "User-Agent": USER_AGENT,
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
      logEnvPresence();
      return {
        ok: false,
        error:
          authJson.error_description ||
          authJson.msg ||
          authJson.error ||
          "Login OsteoRAG falló (email/password).",
        status: 401,
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

  logEnvPresence();
  return {
    ok: false,
    error:
      "OsteoRAG no está configurado. En Vercel pon OSTEORAG_EMAIL + OSTEORAG_PASSWORD (login de OsteoRAG).",
    status: 503,
  };
}

export type OsteoAuthHeadersResult =
  | { ok: true; headers: Record<string, string>; base: string }
  | { ok: false; error: string; status: number };

/** Auth headers for Worker API calls (chat, feedback, …). */
export async function getOsteoAuthHeaders(): Promise<OsteoAuthHeadersResult> {
  const base = getOsteoBase();
  const auth = await getOsteoBearer(base);
  if (!auth.ok) {
    return { ok: false, error: auth.error, status: auth.status };
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": USER_AGENT,
  };
  if (auth.token.startsWith("basic:")) {
    headers.Authorization = `Basic ${auth.token.slice("basic:".length)}`;
  } else {
    headers.Authorization = `Bearer ${auth.token}`;
  }
  return { ok: true, headers, base };
}

export type OsteoFeedbackSource =
  | "publicidad"
  | "osteorag"
  | "resumen_clinico"
  | "feedback";

/** No PII — titles + topic only. Never patientId / names / emails / notes. */
export type OsteoFeedbackPayload = {
  rating: -1;
  source: OsteoFeedbackSource;
  topic_or_question?: string;
  downvoted_titles: string[];
  prompt_version?: string;
};

export type ForwardOsteoFeedbackResult = {
  forwarded: boolean;
  status?: number;
  reason?: string;
};

/**
 * Best-effort POST to Worker `POST /api/feedback`.
 * Never throws; 404/501/network → warn and return forwarded:false.
 * Clinic feedback must still succeed when Worker lacks the endpoint.
 */
export async function forwardOsteoFeedback(
  payload: OsteoFeedbackPayload,
): Promise<ForwardOsteoFeedbackResult> {
  if (payload.rating !== -1) {
    return { forwarded: false, reason: "not_downvote" };
  }
  const titles = (payload.downvoted_titles || [])
    .map(String)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 30);
  if (!titles.length) {
    return { forwarded: false, reason: "no_titles" };
  }

  try {
    const auth = await getOsteoAuthHeaders();
    if (!auth.ok) {
      console.warn("osteorag feedback forward: auth failed", auth.error);
      return { forwarded: false, status: auth.status, reason: "auth" };
    }

    const body: Record<string, unknown> = {
      rating: -1,
      source: payload.source,
      downvoted_titles: titles,
    };
    if (payload.topic_or_question) {
      body.topic_or_question = String(payload.topic_or_question).slice(0, 500);
    }
    if (payload.prompt_version) {
      body.prompt_version = String(payload.prompt_version).slice(0, 64);
    }

    const res = await fetch(`${auth.base}/api/feedback`, {
      method: "POST",
      headers: auth.headers,
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      invalidateOsteoAuthCache();
    }

    if (res.ok) {
      return { forwarded: true, status: res.status };
    }

    // Worker may not implement /api/feedback yet (404/501) — degrade gracefully
    console.warn(
      "osteorag feedback forward: Worker returned",
      res.status,
      "(clinic feedback already saved; demote pending Worker)",
    );
    return { forwarded: false, status: res.status, reason: "upstream" };
  } catch (err) {
    console.warn(
      "osteorag feedback forward: network/error",
      err instanceof Error ? err.message : err,
    );
    return { forwarded: false, reason: "network" };
  }
}
