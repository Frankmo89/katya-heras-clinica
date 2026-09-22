"use client";

import { useCallback, useEffect, useState } from "react";
import { authHeaders } from "@/lib/authFetch";
import {
  BarChart3,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Megaphone,
  Stethoscope,
} from "lucide-react";

type InsightsPayload = {
  counts: {
    thumbsUp: number;
    thumbsDown: number;
    published: number;
    draftOnly: number;
    marketingRows: number;
    clinicalRows: number;
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

export default function InsightsPage() {
  const [data, setData] = useState<InsightsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/insights", {
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
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>

          <div className="grid gap-5 md:grid-cols-2">
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

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bronze)]">
                Fuentes con 👎 recientes
              </h2>
              {data.recentDownvotedSources.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  Sin fuentes marcadas en 👎 todavía.
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
                  Marketing (últimos {data.marketing.length})
                </h2>
              </div>
              <ul className="space-y-3">
                {data.marketing.length === 0 && (
                  <li className="text-sm text-slate-500">Sin eventos.</li>
                )}
                {data.marketing.map((row) => (
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
                      {row.rating === 1 && <span>👍</span>}
                      {row.rating === -1 && <span>👎</span>}
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {row.topic || "—"}
                    </p>
                    {row.preview && (
                      <p className="mt-1 line-clamp-2 text-[12px] text-slate-500">
                        {row.preview}
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
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="mb-3 flex items-center gap-2">
                <Stethoscope size={14} className="text-[var(--color-bronze)]" />
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bronze)]">
                  Clínico (últimos {data.clinical.length})
                </h2>
              </div>
              <ul className="space-y-3">
                {data.clinical.length === 0 && (
                  <li className="text-sm text-slate-500">Sin eventos.</li>
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
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {row.topic || "—"}
                    </p>
                    {row.preview && (
                      <p className="mt-1 line-clamp-2 text-[12px] text-slate-500">
                        {row.preview}
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
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
