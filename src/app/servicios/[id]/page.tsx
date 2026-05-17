import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ServiceDetailContent } from "./ServiceDetailContent";
import { mapDbService, type DbService, type Service, type ServiceDetailData, type TimelineRow, type FaqItem } from "@/data/services";

// ── Extended DB row type (includes JSONB content columns) ─────────────────
interface DbTimeline { time: string; title: string; desc: string; }
interface DbFaq      { question: string; answer: string; }

interface DbServiceFull extends DbService {
  hero_image:     string | null;
  gallery_images: string[] | null;
  timeline:       DbTimeline[] | null;
  ideal_for:      string[] | null;
  not_for:        string[] | null;
  faqs:           DbFaq[] | null;
}

// ── Map DB row → ServiceDetailData expected by ServiceDetailContent ────────
function buildDetail(row: DbServiceFull): ServiceDetailData {
  const timelineRows: TimelineRow[] = (row.timeline ?? []).map((step) => ({
    t:  step.time,
    es: { h: step.title, p: step.desc },
    en: { h: step.title, p: step.desc },
  }));

  const faqs: FaqItem[] = (row.faqs ?? []).map((f) => ({
    es: { q: f.question, a: f.answer },
    en: { q: f.question, a: f.answer },
  }));

  return {
    hero: {
      es: {
        eyebrow: `${row.duration_minutes ?? 60} min`,
        kicker:  row.title_es,
        head:    row.subtitle_es ?? row.title_es,
        lede:    row.description_es ?? "",
      },
      en: {
        eyebrow: `${row.duration_minutes ?? 60} min`,
        kicker:  row.title_en  ?? row.title_es,
        head:    row.subtitle_en  ?? row.subtitle_es  ?? (row.title_en ?? row.title_es),
        lede:    row.description_en ?? row.description_es ?? "",
      },
    },
    timeline: timelineRows,
    forWhom:  { es: row.ideal_for ?? [], en: row.ideal_for ?? [] },
    notFor:   { es: row.not_for   ?? [], en: row.not_for   ?? [] },
    faq:      faqs,
    related:  [],
  };
}

function supabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// ── Metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await supabaseClient()
    .from("services")
    .select("title_es, description_es")
    .eq("id", id)
    .single();
  if (!data) return {};
  return {
    title:       `${data.title_es} · Katya Heras Clínica`,
    description: (data.description_es as string | null) ?? undefined,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────
export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseClient();

  const [{ data: row }, { data: allServices }] = await Promise.all([
    sb.from("services").select("*").eq("id", id).single(),
    sb.from("services")
      .select("id, title_es, title_en, subtitle_es, subtitle_en, description_es, description_en, duration_minutes, price, tone")
      .order("created_at"),
  ]);

  if (!row) notFound();

  const svc    = mapDbService(row as DbService);
  const detail = buildDetail(row as DbServiceFull);

  const relatedServices: Service[] = (allServices ?? [])
    .filter((r) => r.id !== id)
    .slice(0, 3)
    .map((r) => mapDbService(r as DbService));

  const serviceIndex = ((allServices ?? []).findIndex((r) => r.id === id) + 1) || 1;

  return (
    <ServiceDetailContent
      svc={svc}
      detail={detail}
      relatedServices={relatedServices}
      serviceIndex={serviceIndex}
    />
  );
}
