import { createClient } from "@supabase/supabase-js";

export type LearningSource =
  | "osteorag"
  | "publicidad"
  | "resumen_clinico"
  | "feedback"
  | "other";

export type LearningEventType =
  | "query"
  | "generate"
  | "rating"
  | "conclusion";

export type LearningEventInput = {
  source: LearningSource;
  event_type: LearningEventType;
  topic_or_question?: string | null;
  folder_filter?: string | null;
  patient_id?: string | null;
  rating?: -1 | 1 | null;
  rating_note?: string | null;
  output_preview?: string | null;
  citation_titles?: string[] | null;
  related_event_id?: string | null;
  meta?: Record<string, unknown>;
  admin_user_id?: string | null;
};

function serviceClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Fire-and-forget safe logger for the learning loop. Never throws to callers. */
export async function logLearningEvent(
  input: LearningEventInput,
): Promise<string | null> {
  try {
    const supabase = serviceClient();
    if (!supabase) return null;

    const preview = input.output_preview
      ? String(input.output_preview).slice(0, 1500)
      : null;
    const question = input.topic_or_question
      ? String(input.topic_or_question).slice(0, 2000)
      : null;

    const { data, error } = await supabase
      .from("ai_learning_events")
      .insert({
        source: input.source,
        event_type: input.event_type,
        topic_or_question: question,
        folder_filter: input.folder_filter ?? null,
        patient_id: input.patient_id ?? null,
        rating: input.rating ?? null,
        rating_note: input.rating_note
          ? String(input.rating_note).slice(0, 500)
          : null,
        output_preview: preview,
        citation_titles: input.citation_titles ?? [],
        related_event_id: input.related_event_id ?? null,
        meta: input.meta ?? {},
        admin_user_id: input.admin_user_id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.warn("logLearningEvent", error.message);
      return null;
    }
    return (data?.id as string) || null;
  } catch (err) {
    console.warn("logLearningEvent unexpected", err);
    return null;
  }
}
