import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Publicidad prompt / pack schema version. */
export const PUBLICIDAD_PROMPT_VERSION = "pub-v1";

/** OsteoRAG consult prompt version (clinic-side wrapper). */
export const OSTEORAG_PROMPT_VERSION = "orag-v1";

/** Resumen clínico prompt version. */
export const RESUMEN_PROMPT_VERSION = "resumen-v1";

/**
 * Groq model fallback chain for publicidad / resumen.
 * Try in order; if a model 404s / is decommissioned, try the next.
 */
/** Self-serve Groq models as of 2026-09 (Llama 3.x moved to Enterprise). */
export const GROQ_MODEL_FALLBACK = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-20b",
] as const;

export type MarketingEventType =
  | "generate"
  | "rating"
  | "publish"
  | "outcome";

export type ClinicalSource = "osteorag" | "resumen_clinico" | "other";

export type ClinicalEventType =
  | "query"
  | "generate"
  | "rating"
  | "conclusion";

export type MarketingEventInput = {
  event_type: MarketingEventType;
  topic?: string | null;
  folder_filter?: string | null;
  prompt_version?: string | null;
  model?: string | null;
  output_draft?: string | null;
  output_published?: string | null;
  rating?: -1 | 1 | null;
  rating_note?: string | null;
  citation_titles?: string[] | null;
  downvoted_sources?: string[] | null;
  related_event_id?: string | null;
  outcome_leads?: number | null;
  outcome_bookings?: number | null;
  outcome_notes?: string | null;
  meta?: Record<string, unknown>;
};

export type ClinicalEventInput = {
  source: ClinicalSource;
  event_type: ClinicalEventType;
  topic_or_question?: string | null;
  folder_filter?: string | null;
  prompt_version?: string | null;
  model?: string | null;
  output_draft?: string | null;
  rating?: -1 | 1 | null;
  rating_note?: string | null;
  citation_titles?: string[] | null;
  downvoted_sources?: string[] | null;
  related_event_id?: string | null;
  meta?: Record<string, unknown>;
};

export type ClinicalAuditInput = {
  patient_id: string;
  clinical_event_id?: string | null;
  source?: string | null;
  note?: string | null;
  meta?: Record<string, unknown>;
};

function serviceClient(): SupabaseClient | null {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function slice(s: string | null | undefined, max: number): string | null {
  if (s == null) return null;
  const t = String(s);
  return t.length > max ? t.slice(0, max) : t;
}

/** Insert into ai_marketing_events. Never throws; returns id or null. */
export async function logMarketingEvent(
  input: MarketingEventInput,
): Promise<string | null> {
  try {
    const supabase = serviceClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("ai_marketing_events")
      .insert({
        event_type: input.event_type,
        topic: slice(input.topic, 2000),
        folder_filter: input.folder_filter ?? null,
        prompt_version: input.prompt_version ?? null,
        model: input.model ?? null,
        output_draft: slice(input.output_draft, 12000),
        output_published: slice(input.output_published, 12000),
        rating: input.rating ?? null,
        rating_note: slice(input.rating_note, 500),
        citation_titles: input.citation_titles ?? [],
        downvoted_sources: input.downvoted_sources ?? [],
        related_event_id: input.related_event_id ?? null,
        outcome_leads: input.outcome_leads ?? null,
        outcome_bookings: input.outcome_bookings ?? null,
        outcome_notes: slice(input.outcome_notes, 2000),
        outcome_at:
          input.outcome_leads != null ||
          input.outcome_bookings != null ||
          input.outcome_notes
            ? new Date().toISOString()
            : null,
        meta: input.meta ?? {},
      })
      .select("id")
      .single();

    if (error) {
      console.warn("logMarketingEvent", error.message);
      return null;
    }
    return (data?.id as string) || null;
  } catch (err) {
    console.warn("logMarketingEvent unexpected", err);
    return null;
  }
}

/**
 * Insert into ai_clinical_events. Never include patient_id.
 * Never throws; returns id or null.
 */
export async function logClinicalEvent(
  input: ClinicalEventInput,
): Promise<string | null> {
  try {
    const supabase = serviceClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("ai_clinical_events")
      .insert({
        source: input.source,
        event_type: input.event_type,
        topic_or_question: slice(input.topic_or_question, 2000),
        folder_filter: input.folder_filter ?? null,
        prompt_version: input.prompt_version ?? null,
        model: input.model ?? null,
        output_draft: slice(input.output_draft, 12000),
        rating: input.rating ?? null,
        rating_note: slice(input.rating_note, 500),
        citation_titles: input.citation_titles ?? [],
        downvoted_sources: input.downvoted_sources ?? [],
        related_event_id: input.related_event_id ?? null,
        meta: input.meta ?? {},
      })
      .select("id")
      .single();

    if (error) {
      console.warn("logClinicalEvent", error.message);
      return null;
    }
    return (data?.id as string) || null;
  } catch (err) {
    console.warn("logClinicalEvent unexpected", err);
    return null;
  }
}

/** EMR trazabilidad only. Never throws. */
export async function logClinicalAudit(
  input: ClinicalAuditInput,
): Promise<string | null> {
  try {
    const supabase = serviceClient();
    if (!supabase) return null;
    if (!input.patient_id) return null;

    const { data, error } = await supabase
      .from("ai_clinical_audit")
      .insert({
        patient_id: input.patient_id,
        clinical_event_id: input.clinical_event_id ?? null,
        source: input.source ?? null,
        note: slice(input.note, 500),
        meta: input.meta ?? {},
      })
      .select("id")
      .single();

    if (error) {
      console.warn("logClinicalAudit", error.message);
      return null;
    }
    return (data?.id as string) || null;
  } catch (err) {
    console.warn("logClinicalAudit unexpected", err);
    return null;
  }
}

/** Mark a marketing generate event as published (copied / posted). */
export async function markMarketingPublished(
  eventId: string,
  publishedText: string,
  meta?: Record<string, unknown>,
): Promise<boolean> {
  try {
    const supabase = serviceClient();
    if (!supabase || !eventId) return false;

    const patch: Record<string, unknown> = {
      output_published: slice(publishedText, 12000),
    };

    if (meta) {
      const { data: row } = await supabase
        .from("ai_marketing_events")
        .select("meta")
        .eq("id", eventId)
        .maybeSingle();
      const prev =
        row?.meta && typeof row.meta === "object"
          ? (row.meta as Record<string, unknown>)
          : {};
      patch.meta = { ...prev, ...meta, published_at: new Date().toISOString() };
    }

    const { error } = await supabase
      .from("ai_marketing_events")
      .update(patch)
      .eq("id", eventId);

    if (error) {
      console.warn("markMarketingPublished", error.message);
      return false;
    }

    await logMarketingEvent({
      event_type: "publish",
      related_event_id: eventId,
      output_published: publishedText,
      meta: meta ?? { channel: "copy" },
    });

    return true;
  } catch (err) {
    console.warn("markMarketingPublished unexpected", err);
    return false;
  }
}

/** Update leads/bookings outcomes on a marketing generate event. */
export async function updateMarketingOutcome(
  eventId: string,
  outcome: {
    leads?: number | null;
    bookings?: number | null;
    notes?: string | null;
  },
): Promise<boolean> {
  try {
    const supabase = serviceClient();
    if (!supabase || !eventId) return false;

    const patch: Record<string, unknown> = {
      outcome_at: new Date().toISOString(),
    };
    if (outcome.leads !== undefined) patch.outcome_leads = outcome.leads;
    if (outcome.bookings !== undefined)
      patch.outcome_bookings = outcome.bookings;
    if (outcome.notes !== undefined)
      patch.outcome_notes = slice(outcome.notes, 2000);

    const { error } = await supabase
      .from("ai_marketing_events")
      .update(patch)
      .eq("id", eventId);

    if (error) {
      console.warn("updateMarketingOutcome", error.message);
      return false;
    }

    await logMarketingEvent({
      event_type: "outcome",
      related_event_id: eventId,
      outcome_leads: outcome.leads ?? null,
      outcome_bookings: outcome.bookings ?? null,
      outcome_notes: outcome.notes ?? null,
    });

    return true;
  } catch (err) {
    console.warn("updateMarketingOutcome unexpected", err);
    return false;
  }
}

export type ApplyRatingInput = {
  domain: "marketing" | "clinical";
  rating: -1 | 1;
  rating_note?: string | null;
  related_event_id?: string | null;
  downvoted_sources?: string[] | null;
  citation_titles?: string[] | null;
  topic_or_question?: string | null;
  /** clinical only */
  source?: ClinicalSource;
  /** audit only — never written to ML tables */
  patient_id?: string | null;
  output_preview?: string | null;
};

/**
 * Apply 👍/👎. Prefer updating the related generate/query row when
 * related_event_id is set; also insert a rating child row.
 * On 👎, store downvoted_sources on the related row.
 */
export async function applyRating(
  input: ApplyRatingInput,
): Promise<string | null> {
  try {
    const supabase = serviceClient();
    if (!supabase) return null;

    const downvoted =
      input.rating === -1 && input.downvoted_sources?.length
        ? input.downvoted_sources
        : input.rating === -1 && input.citation_titles?.length
          ? input.citation_titles
          : [];

    if (input.related_event_id) {
      const table =
        input.domain === "marketing"
          ? "ai_marketing_events"
          : "ai_clinical_events";
      const patch: Record<string, unknown> = {
        rating: input.rating,
        rating_note: slice(input.rating_note, 500),
      };
      if (input.rating === -1 && downvoted.length) {
        patch.downvoted_sources = downvoted;
      }
      const { error } = await supabase
        .from(table)
        .update(patch)
        .eq("id", input.related_event_id);
      if (error) console.warn("applyRating update related", error.message);
    }

    let ratingEventId: string | null = null;
    if (input.domain === "marketing") {
      ratingEventId = await logMarketingEvent({
        event_type: "rating",
        topic: input.topic_or_question,
        rating: input.rating,
        rating_note: input.rating_note,
        related_event_id: input.related_event_id,
        downvoted_sources: downvoted,
        citation_titles: input.citation_titles,
        output_draft: input.output_preview,
        meta: { ui: "thumbs" },
      });
    } else {
      ratingEventId = await logClinicalEvent({
        source: input.source || "other",
        event_type: "rating",
        topic_or_question: input.topic_or_question,
        rating: input.rating,
        rating_note: input.rating_note,
        related_event_id: input.related_event_id,
        downvoted_sources: downvoted,
        citation_titles: input.citation_titles,
        output_draft: input.output_preview,
        meta: { ui: "thumbs" },
      });
    }

    if (input.patient_id && input.domain === "clinical") {
      await logClinicalAudit({
        patient_id: input.patient_id,
        clinical_event_id: input.related_event_id || ratingEventId,
        source: input.source || "feedback",
        note: `rating:${input.rating}`,
        meta: { rating_event_id: ratingEventId },
      });
    }

    return ratingEventId;
  } catch (err) {
    console.warn("applyRating unexpected", err);
    return null;
  }
}

/**
 * Call Groq chat.completions with model fallback chain.
 * Returns { raw, model } of the first model that succeeds.
 */
export async function groqChatWithFallback(opts: {
  apiKey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[];
  temperature?: number;
  json?: boolean;
  models?: readonly string[];
}): Promise<{ raw: string; model: string }> {
  // Dynamic import keeps this helper usable without bundling issues
  const Groq = (await import("groq-sdk")).default;
  const groq = new Groq({ apiKey: opts.apiKey });
  const models = opts.models ?? GROQ_MODEL_FALLBACK;
  let lastErr: unknown = null;

  for (const model of models) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        temperature: opts.temperature ?? 0.5,
        ...(opts.json ? { response_format: { type: "json_object" as const } } : {}),
        messages: opts.messages,
      });
      const raw = completion.choices[0]?.message?.content || "";
      return { raw, model };
    } catch (err: unknown) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const status =
        err && typeof err === "object" && "status" in err
          ? Number((err as { status?: number }).status)
          : undefined;
      // Model gone / not found → try next; other errors also try next once
      console.warn(`groq model ${model} failed`, status ?? "", msg.slice(0, 200));
      continue;
    }
  }

  const lastMsg =
    lastErr instanceof Error ? lastErr.message : String(lastErr ?? "");
  throw new Error(
    `Ningún modelo Groq disponible (${models.join(" → ")}). Último error: ${lastMsg.slice(0, 240)}`,
  );
}
