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

type DaysFilter = "7" | "30" | "90" | "all";
type RatingFilter = "all" | "up" | "down";
type PublishedFilter = "all" | "yes" | "no";

function parseDays(raw: string | null): DaysFilter {
  if (raw === "7" || raw === "30" || raw === "90" || raw === "all") return raw;
  return "30";
}

function parseRating(raw: string | null): RatingFilter {
  if (raw === "up" || raw === "down" || raw === "all") return raw;
  return "all";
}

function parsePublished(raw: string | null): PublishedFilter {
  if (raw === "yes" || raw === "no" || raw === "all") return raw;
  return "all";
}

function sinceIso(days: DaysFilter): string | null {
  if (days === "all") return null;
  const n = Number(days);
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

function channelFromMeta(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as Record<string, unknown>;
  if (typeof m.channel === "string" && m.channel.trim()) return m.channel.trim();
  if (Array.isArray(m.published_channels)) {
    const chans = m.published_channels.filter(
      (c): c is string => typeof c === "string" && !!c.trim(),
    );
    if (chans.length) return chans[chans.length - 1] ?? null;
  }
  return null;
}

function channelsFromMeta(meta: unknown): string[] {
  if (!meta || typeof meta !== "object") return [];
  const m = meta as Record<string, unknown>;
  if (Array.isArray(m.published_channels)) {
    return m.published_channels.filter(
      (c): c is string => typeof c === "string" && !!c.trim(),
    );
  }
  if (typeof m.channel === "string" && m.channel.trim()) {
    return [m.channel.trim()];
  }
  return [];
}

/**
 * GET /api/ai/insights
 * Staff-only summary of recent marketing + clinical ML events.
 * Query: days=7|30|90|all (default 30), rating=all|up|down, published=all|yes|no
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

    const url = new URL(request.url);
    const days = parseDays(url.searchParams.get("days"));
    const rating = parseRating(url.searchParams.get("rating"));
    const published = parsePublished(url.searchParams.get("published"));
    const since = sinceIso(days);

    let mktQ = supabase
      .from("ai_marketing_events")
      .select(
        "id, created_at, event_type, topic, prompt_version, model, rating, rating_note, downvoted_sources, output_published, output_draft, outcome_leads, outcome_bookings, meta",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    let clinQ = supabase
      .from("ai_clinical_events")
      .select(
        "id, created_at, source, event_type, topic_or_question, prompt_version, model, rating, rating_note, downvoted_sources, output_draft",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (since) {
      mktQ = mktQ.gte("created_at", since);
      clinQ = clinQ.gte("created_at", since);
    }

    const [mktRes, clinRes] = await Promise.all([mktQ, clinQ]);

    if (mktRes.error) console.warn("insights marketing", mktRes.error.message);
    if (clinRes.error) console.warn("insights clinical", clinRes.error.message);

    let marketing = mktRes.data || [];
    let clinical = clinRes.data || [];

    if (rating === "up") {
      marketing = marketing.filter((r) => r.rating === 1);
      clinical = clinical.filter((r) => r.rating === 1);
    } else if (rating === "down") {
      marketing = marketing.filter((r) => r.rating === -1);
      clinical = clinical.filter((r) => r.rating === -1);
    }

    if (published === "yes") {
      marketing = marketing.filter((r) => Boolean(r.output_published));
    } else if (published === "no") {
      marketing = marketing.filter(
        (r) => r.event_type === "generate" && !r.output_published,
      );
    }

    let thumbsUp = 0;
    let thumbsDown = 0;
    let publishedCount = 0;
    let draftOnly = 0;
    let totalLeads = 0;
    let totalBookings = 0;
    const topics: CountMap = {};
    const downvoted: string[] = [];

    for (const row of marketing) {
      if (row.rating === 1) thumbsUp += 1;
      if (row.rating === -1) thumbsDown += 1;
      if (row.event_type === "generate") {
        bump(topics, row.topic);
        if (row.output_published) publishedCount += 1;
        else draftOnly += 1;
      }
      if (typeof row.outcome_leads === "number") totalLeads += row.outcome_leads;
      if (typeof row.outcome_bookings === "number")
        totalBookings += row.outcome_bookings;
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

    const listLimit = 40;

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
      channel: channelFromMeta(row.meta),
      channels: channelsFromMeta(row.meta),
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
      filters: { days, rating, published },
      counts: {
        thumbsUp,
        thumbsDown,
        published: publishedCount,
        draftOnly,
        marketingRows: marketing.length,
        clinicalRows: clinical.length,
        totalLeads,
        totalBookings,
      },
      topTopics,
      recentDownvotedSources: [...new Set(downvoted)].slice(0, 20),
      marketing: marketing.slice(0, listLimit).map(summarizeMkt),
      clinical: clinical.slice(0, listLimit).map(summarizeClin),
    });
  } catch (err) {
    console.error("insights", err);
    return NextResponse.json(
      { error: "Error al cargar insights." },
      { status: 500 },
    );
  }
}
