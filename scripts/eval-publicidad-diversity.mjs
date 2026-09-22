#!/usr/bin/env node
/**
 * Eval diversidad Publicidad — 5 temas.
 *
 * Modes:
 *   default       — POST /api/ai/publicidad (needs BASE_URL + STAFF_ACCESS_TOKEN)
 *   --corpus-only — hit OsteoRAG worker chat for retrieval diversity (OSTEORAG_*)
 *
 * Never prints secrets. Exits 0 on structural PASS, 1 on FAIL / missing config.
 */

const TOPICS = [
  "Osteopatía visceral",
  "Masaje tailandés espalda",
  "Kinesiotape lumbar",
  "Cervicalgia / cuello",
  "Fascia / liberación miofascial",
];

const corpusOnly = process.argv.includes("--corpus-only");

function env(name) {
  return String(process.env[name] ?? "").trim();
}

function tokenOverlap(a, b) {
  const tok = (s) =>
    new Set(
      String(s || "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((t) => t.length > 3),
    );
  const A = tok(a);
  const B = tok(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  return inter / Math.min(A.size, B.size);
}

async function osteoBearer(base) {
  const email = env("OSTEORAG_EMAIL");
  const password = env("OSTEORAG_PASSWORD");
  const direct = env("OSTEORAG_BEARER_TOKEN");
  if (direct) return direct;
  if (!email || !password) return null;

  const cfgRes = await fetch(`${base}/api/config`, {
    headers: { Accept: "application/json", "User-Agent": "KatyaEval/1.0" },
  });
  if (!cfgRes.ok) throw new Error(`OsteoRAG /api/config ${cfgRes.status}`);
  const cfg = await cfgRes.json();
  const supabaseUrl = String(cfg.supabaseUrl || "").replace(/\/$/, "");
  const anon = cfg.supabaseAnonKey || "";
  if (!supabaseUrl || !anon) throw new Error("OsteoRAG config incomplete");

  const authRes = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anon,
        Authorization: `Bearer ${anon}`,
      },
      body: JSON.stringify({ email, password }),
    },
  );
  const authJson = await authRes.json();
  if (!authRes.ok || !authJson.access_token) {
    throw new Error("OsteoRAG login failed");
  }
  return authJson.access_token;
}

async function runCorpusOnly() {
  const base = (
    env("OSTEORAG_BASE_URL") || "https://osteorag.alonsosky617.workers.dev"
  ).replace(/\/$/, "");
  const token = await osteoBearer(base);
  if (!token) {
    console.error(
      "Missing OSTEORAG_EMAIL/PASSWORD (or OSTEORAG_BEARER_TOKEN). See docs/evals/publicidad-5-topics.md",
    );
    process.exit(1);
  }

  const answers = [];
  for (const topic of TOPICS) {
    const message = [
      "Resume hechos útiles del corpus sobre el tema. No diagnostiques.",
      `Tema: ${topic}`,
    ].join("\n");
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, folderFilter: "all" }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `OsteoRAG ${res.status}`);
    const answer = String(json.answer || "");
    answers.push({ topic, answer, citations: json.citations || [] });
    console.log(
      `✓ corpus ${topic} — ${answer.length} chars, ${(json.citations || []).length} cites`,
    );
  }

  let fail = 0;
  for (let i = 0; i < answers.length; i++) {
    for (let j = i + 1; j < answers.length; j++) {
      const o = tokenOverlap(answers[i].answer, answers[j].answer);
      const ok = o < 0.85;
      console.log(
        `  overlap "${answers[i].topic}" vs "${answers[j].topic}": ${(o * 100).toFixed(1)}% ${ok ? "PASS" : "FAIL"}`,
      );
      if (!ok) fail += 1;
    }
  }
  process.exit(fail ? 1 : 0);
}

async function runFullApi() {
  const base = (env("BASE_URL") || "").replace(/\/$/, "");
  const token = env("STAFF_ACCESS_TOKEN");
  if (!base || !token) {
    console.error(
      "Need BASE_URL + STAFF_ACCESS_TOKEN for full API eval.\n" +
        "Or run with --corpus-only if only OsteoRAG secrets are available.\n" +
        "Checklist: docs/evals/publicidad-5-topics.md",
    );
    process.exit(1);
  }

  const packs = [];
  for (const topic of TOPICS) {
    const res = await fetch(`${base}/api/ai/publicidad`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ topic, folderFilter: "all" }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `publicidad ${res.status}`);
    packs.push(json);
    console.log(
      `✓ ${topic} — model=${json.model || "?"} prompt=${json.prompt_version || "?"} eventId=${json.eventId || "?"}`,
    );
  }

  let fail = 0;
  for (let i = 0; i < packs.length; i++) {
    for (let j = i + 1; j < packs.length; j++) {
      const a = packs[i].articulo_corto || "";
      const b = packs[j].articulo_corto || "";
      const o = tokenOverlap(a, b);
      const ok = o < 0.7;
      console.log(
        `  article overlap "${TOPICS[i]}" vs "${TOPICS[j]}": ${(o * 100).toFixed(1)}% ${ok ? "PASS" : "FAIL"}`,
      );
      if (!ok) fail += 1;
    }
    if (!packs[i].eventId || !packs[i].model || !packs[i].prompt_version) {
      console.log(`  FAIL ${TOPICS[i]}: missing eventId/model/prompt_version`);
      fail += 1;
    }
  }
  process.exit(fail ? 1 : 0);
}

async function main() {
  console.log("Publicidad diversity eval — 5 topics");
  console.log(TOPICS.map((t, i) => `  ${i + 1}. ${t}`).join("\n"));
  if (corpusOnly) await runCorpusOnly();
  else await runFullApi();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
