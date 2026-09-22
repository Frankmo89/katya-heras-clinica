import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireStaffSession } from "@/lib/requireStaffSession";

export const runtime = "nodejs";

function serviceClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type CountMap = Record<string, number>;

function bump(map: CountMap, key: string | null | undefined) {
  const k = (key || "").trim();
  if (!k) return;
  map[k] = (map[k] || 0) + 1;
}

/**
 * GET /api/ai/insights
 * Staff-only summary of recent marketing + clinical ML events.
 */
export async function GET(request: Request) {
  try {
    if (!(await requireStaffSession(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = serviceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase no configurado." },
        { status: 503 },
      );
    }

    const [mktRes, clinRes] = await Promise.all([
      supabase
        .from("ai_marketing_events")
        .select(
          "id, created_at, event_type, topic, prompt_version, model, rating, rating_note, downvoted_sources, output_published, output_draft, outcome_leads, outcome_bookings",
        )
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("ai_clinical_events")
        .select(
          "id, created_at, source, event_type, topic_or_question, prompt_version, model, rating, rating_note, downvoted_sources, output_draft",
        )
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    if (mktRes.error) console.warn("insights marketing", mktRes.error.message);
    if (clinRes.error) console.warn("insights clinical", clinRes.error.message);

    const marketing = mktRes.data || [];
    const clinical = clinRes.data || [];

    let thumbsUp = 0;
    let thumbsDown = 0;
    let published = 0;
    let draftOnly = 0;
    const topics: CountMap = {};
    const downvoted: string[] = [];

    for (const row of marketing) {
      if (row.rating === 1) thumbsUp += 1;
      if (row.rating === -1) thumbsDown += 1;
      if (row.event_type === "generate") {
        bump(topics, row.topic);
        if (row.output_published) published += 1;
        else draftOnly += 1;
      }
      if (Array.isArray(row.downvoted_sources)) {
        for (const s of row.downvoted_sources) {
          if (s && downvoted.length < 40) downvoted.push(String(s));
        }
      }
    }

    for (const row of clinical) {
      if (row.rating === 1) thumbsUp += 1;
      if (row.rating === -1) thumbsDown += 1;
      if (row.event_type === "query" || row.event_type === "conclusion") {
        bump(topics, row.topic_or_question);
      }
      if (Array.isArray(row.downvoted_sources)) {
        for (const s of row.downvoted_sources) {
          if (s && downvoted.length < 40) downvoted.push(String(s));
        }
      }
    }

    const topTopics = Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    const summarizeMkt = (row: (typeof marketing)[0]) => ({
      id: row.id,
      created_at: row.created_at,
      event_type: row.event_type,
      topic: row.topic,
      model: row.model,
      prompt_version: row.prompt_version,
      rating: row.rating,
      published: Boolean(row.output_published),
      preview: String(row.output_draft || row.output_published || "").slice(
        0,
        160,
      ),
      outcome_leads: row.outcome_leads,
      outcome_bookings: row.outcome_bookings,
    });

    const summarizeClin = (row: (typeof clinical)[0]) => ({
      id: row.id,
      created_at: row.created_at,
      source: row.source,
      event_type: row.event_type,
      topic: row.topic_or_question,
      model: row.model,
      prompt_version: row.prompt_version,
      rating: row.rating,
      preview: String(row.output_draft || "").slice(0, 160),
    });

    return NextResponse.json({
      counts: {
        thumbsUp,
        thumbsDown,
        published,
        draftOnly,
        marketingRows: marketing.length,
        clinicalRows: clinical.length,
      },
      topTopics,
      recentDownvotedSources: [...new Set(downvoted)].slice(0, 20),
      marketing: marketing.map(summarizeMkt),
      clinical: clinical.map(summarizeClin),
    });
  } catch (err) {
    console.error("insights", err);
    return NextResponse.json(
      { error: "Error al cargar insights." },
      { status: 500 },
    );
  }
}
