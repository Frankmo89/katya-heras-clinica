"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { authHeaders } from "@/lib/authFetch";
import {
  BarChart3,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Megaphone,
  Stethoscope,
  Users,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";

type DaysFilter = "7" | "30" | "90" | "all";
type RatingFilter = "all" | "up" | "down";
type PublishedFilter = "all" | "yes" | "no";

type InsightsPayload = {
  filters?: {
    days: DaysFilter;
    rating: RatingFilter;
    published: PublishedFilter;
  };
  counts: {
    thumbsUp: number;
    thumbsDown: number;
    published: number;
    draftOnly: number;
    marketingRows: number;
    clinicalRows: number;
    totalLeads?: number;
    totalBookings?: number;
  };
  topTopics: { topic: string; count: number }[];
  recentDownvotedSources: string[];
  marketing: {
    id: string;
    created_at: string;
    event_type: string;
    topic: string | null;
    model: string | null;
    prompt_version: string | null;
    rating: number | null;
    published: boolean;
    preview: string;
    outcome_leads: number | null;
    outcome_bookings: number | null;
    channel?: string | null;
    channels?: string[];
  }[];
  clinical: {
    id: string;
    created_at: string;
    source: string;
    event_type: string;
    topic: string | null;
    model: string | null;
    prompt_version: string | null;
    rating: number | null;
    preview: string;
  }[];
  error?: string;
};

const CHANNEL_LABELS: Record<string, string> = {
  ig_story: "Historia IG",
  ig_post: "Post IG",
  fb: "Facebook",
  articulo: "Artículo",
  copy: "Copiar",
};

const DAY_CHIPS: { id: DaysFilter; label: string }[] = [
  { id: "7", label: "7 días" },
  { id: "30", label: "30 días" },
  { id: "90", label: "90 días" },
  { id: "all", label: "Todo" },
];

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bronze)]">
        <Icon size={14} className="text-[var(--color-bronze)]" />
        {label}
      </div>
      <p className="mt-3 font-serif text-3xl text-slate-800">{value}</p>
    </div>
  );
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function shortId(id: string) {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function EventIdChip({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={id}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(id);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* ignore */
        }
      }}
      className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 font-mono text-[10px] text-slate-400 hover:text-slate-600"
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {shortId(id)}
    </button>
  );
}

function ExpandablePreview({
  preview,
  extra,
}: {
  preview: string;
  extra?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (!preview && !extra) return null;
  return (
    <div className="mt-1">
      {preview && (
        <p
          className={`text-[12px] text-slate-500 ${open ? "whitespace-pre-wrap" : "line-clamp-2"}`}
        >
          {preview}
        </p>
      )}
      {(preview.length > 80 || extra) && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--color-bronze)]"
        >
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {open ? "Menos" : "Más"}
        </button>
      )}
      {open && extra}
    </div>
  );
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<DaysFilter>("30");
  const [soloDown, setSoloDown] = useState(false);
  const [soloPublished, setSoloPublished] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("days", days);
      params.set("rating", soloDown ? "down" : "all");
      params.set("published", soloPublished ? "yes" : "all");
      const res = await fetch(`/api/ai/insights?${params.toString()}`, {
        headers: { ...(await authHeaders()) },
        cache: "no-store",
      });
      const json = (await res.json()) as InsightsPayload;
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [days, soloDown, soloPublished]);

  useEffect(() => {
    // Staff insights fetch on mount / filter change (async; not cascading render).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional data load
    void load();
  }, [load]);

  const chipClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-[11px] uppercase tracking-wider transition ${
      active
        ? "bg-[var(--color-bronze)] text-white"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-bronze)]">
            Aprendizaje · Loop ML
          </p>
          <h1 className="mt-2 font-serif text-3xl text-slate-800">Insights</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
            Últimos eventos de publicidad y consultas clínicas (sin datos de
            paciente en el dataset ML). Útil para ver 👎, temas y borradores
            publicados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-[var(--color-bronze)] hover:text-[var(--color-bronze)] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <BarChart3 size={14} />
          )}
          Actualizar
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {DAY_CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setDays(c.id)}
            className={chipClass(days === c.id)}
          >
            {c.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button
          type="button"
          onClick={() => setSoloDown((v) => !v)}
          className={chipClass(soloDown)}
        >
          Solo 👎
        </button>
        <button
          type="button"
          onClick={() => setSoloPublished((v) => !v)}
          className={chipClass(soloPublished)}
        >
          Solo publicados
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Cargando insights…
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Stat label="👍 Útiles" value={data.counts.thumbsUp} icon={ThumbsUp} />
            <Stat
              label="👎 No útiles"
              value={data.counts.thumbsDown}
              icon={ThumbsDown}
            />
            <Stat
              label="Publicados"
              value={data.counts.published}
              icon={Megaphone}
            />
            <Stat
              label="Solo borrador"
              value={data.counts.draftOnly}
              icon={FileText}
            />
            <Stat
              label="Leads"
              value={data.counts.totalLeads ?? 0}
              icon={Users}
            />
            <Stat
              label="Citas"
              value={data.counts.totalBookings ?? 0}
              icon={CalendarCheck}
            />
          </div>

          <div
            className={`grid gap-5 md:grid-cols-2 ${soloDown ? "md:grid-cols-1" : ""}`}
          >
            {!soloDown && (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bronze)]">
                  Temas más frecuentes
                </h2>
                {data.topTopics.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">Aún no hay temas.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {data.topTopics.map((t) => (
                      <li
                        key={t.topic}
                        className="flex items-center justify-between gap-3 text-sm text-slate-700"
                      >
                        <span className="truncate">{t.topic}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                          {t.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div
              className={`rounded-2xl border bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] ${
                soloDown
                  ? "border-red-100 ring-1 ring-red-50"
                  : "border-slate-100"
              }`}
            >
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bronze)]">
                Fuentes con 👎 {soloDown ? "(filtro activo)" : "recientes"}
              </h2>
              {data.recentDownvotedSources.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  Sin fuentes marcadas en 👎 en este periodo.
                </p>
              ) : (
                <ul className="mt-3 space-y-1.5 text-[13px] text-slate-600">
                  {data.recentDownvotedSources.map((s, i) => (
                    <li key={`${s}-${i}`} className="truncate">
                      · {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="mb-3 flex items-center gap-2">
                <Megaphone size={14} className="text-[var(--color-bronze)]" />
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bronze)]">
                  Marketing ({data.marketing.length}
                  {data.counts.marketingRows > data.marketing.length
                    ? ` de ${data.counts.marketingRows}`
                    : ""}
                  )
                </h2>
              </div>
              <ul className="space-y-3">
                {data.marketing.length === 0 && (
                  <li className="text-sm text-slate-500">
                    Sin eventos en este filtro.
                  </li>
                )}
                {data.marketing.map((row) => {
                  const chans =
                    row.channels?.length
                      ? row.channels
                      : row.channel
                        ? [row.channel]
                        : [];
                  return (
                    <li
                      key={row.id}
                      className="rounded-xl border border-slate-50 bg-slate-50/60 px-3 py-2.5"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span>{fmtDate(row.created_at)}</span>
                        <span className="rounded-full bg-white px-2 py-0.5">
                          {row.event_type}
                        </span>
                        {row.published && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                            publicado
                          </span>
                        )}
                        {chans.map((ch) => (
                          <span
                            key={ch}
                            className="rounded-full bg-[rgba(192,138,94,0.12)] px-2 py-0.5 text-[var(--color-bronze)]"
                          >
                            {CHANNEL_LABELS[ch] || ch}
                          </span>
                        ))}
                        {row.rating === 1 && <span>👍</span>}
                        {row.rating === -1 && <span>👎</span>}
                        <EventIdChip id={row.id} />
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {row.topic || "—"}
                      </p>
                      <ExpandablePreview
                        preview={row.preview}
                        extra={
                          (row.outcome_leads != null ||
                            row.outcome_bookings != null) && (
                            <p className="mt-2 text-[12px] text-slate-600">
                              Resultados:{" "}
                              <span className="font-medium">
                                {row.outcome_leads ?? "—"} leads
                              </span>
                              {" · "}
                              <span className="font-medium">
                                {row.outcome_bookings ?? "—"} citas
                              </span>
                            </p>
                          )
                        }
                      />
                      {(row.outcome_leads != null ||
                        row.outcome_bookings != null) && (
                        <p className="mt-1.5 text-[11px] text-slate-600">
                          <Users size={11} className="mr-1 inline" />
                          {row.outcome_leads ?? "—"} leads
                          <span className="mx-1.5 text-slate-300">·</span>
                          <CalendarCheck size={11} className="mr-1 inline" />
                          {row.outcome_bookings ?? "—"} citas
                        </p>
                      )}
                      {(row.model || row.prompt_version) && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          {[row.model, row.prompt_version]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="mb-3 flex items-center gap-2">
                <Stethoscope size={14} className="text-[var(--color-bronze)]" />
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bronze)]">
                  Clínico ({data.clinical.length}
                  {data.counts.clinicalRows > data.clinical.length
                    ? ` de ${data.counts.clinicalRows}`
                    : ""}
                  )
                </h2>
              </div>
              <ul className="space-y-3">
                {data.clinical.length === 0 && (
                  <li className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-5 text-center">
                    <p className="text-sm text-slate-600">
                      Aún no hay consultas clínicas registradas en este periodo.
                    </p>
                    <p className="mt-2 text-[13px] text-slate-500">
                      Prueba{" "}
                      <span className="font-medium text-slate-700">
                        Consultar material de estudio
                      </span>{" "}
                      en una ficha de paciente.
                    </p>
                    <Link
                      href="/admin/pacientes"
                      className="mt-3 inline-flex items-center justify-center rounded-lg bg-[var(--color-bronze)] px-4 py-2 text-[12px] font-medium text-white hover:bg-[var(--color-bronze-hover)]"
                    >
                      Ir a pacientes
                    </Link>
                  </li>
                )}
                {data.clinical.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-xl border border-slate-50 bg-slate-50/60 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span>{fmtDate(row.created_at)}</span>
                      <span className="rounded-full bg-white px-2 py-0.5">
                        {row.source}/{row.event_type}
                      </span>
                      {row.rating === 1 && <span>👍</span>}
                      {row.rating === -1 && <span>👎</span>}
                      <EventIdChip id={row.id} />
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {row.topic || "—"}
                    </p>
                    <ExpandablePreview preview={row.preview} />
                    {(row.model || row.prompt_version) && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        {[row.model, row.prompt_version]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
