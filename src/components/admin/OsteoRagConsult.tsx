"use client";

import { useMemo, useState } from "react";
import { BookOpen, Loader2, Send } from "lucide-react";

type FolderFilter = "all" | "escuela" | "libros" | "tesis";

interface Citation {
  title: string;
  page: number | null;
  source_folder: string;
  excerpt: string;
}

interface Props {
  patientName: string;
  patientContext?: string;
}

const FILTERS: { id: FolderFilter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "escuela", label: "Escuela" },
  { id: "libros", label: "Libros" },
  { id: "tesis", label: "Tesis" },
];

const SUGGESTIONS = [
  "Técnicas cervicales según material de escuela",
  "Qué es el vendaje neuromuscular / kinesiotape",
  "Contraindicaciones relevantes de VNM",
  "Secuencia o bases craneosacrales (TCS)",
];

export function OsteoRagConsult({ patientName, patientContext = "" }: Props) {
  const [question, setQuestion] = useState("");
  const [folderFilter, setFolderFilter] = useState<FolderFilter>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);

  const contextPreview = useMemo(
    () => (patientContext ? patientContext.slice(0, 280) : ""),
    [patientContext],
  );

  async function ask(q?: string) {
    const finalQ = (q ?? question).trim();
    if (!finalQ || loading) return;
    setQuestion(finalQ);
    setLoading(true);
    setError(null);
    setAnswer(null);
    setCitations([]);
    try {
      const res = await fetch("/api/ai/osteorag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: finalQ,
          patientName,
          patientContext,
          folderFilter,
        }),
      });
      const json = (await res.json()) as {
        answer?: string;
        citations?: Citation[];
        error?: string;
        code?: string;
      };
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      setAnswer(json.answer || "");
      setCitations(json.citations || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-surface-green,#5a7a62)]">
            Corpus · OsteoRAG
          </p>
          <h2 className="font-serif text-xl text-slate-800">Consultar material de estudio</h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-text-muted)]">
            Pregunta al corpus (escuela / libros / tesis) con citas. Orientado a la ficha de{" "}
            <span className="font-medium text-slate-700">{patientName}</span>. No diagnostica.
          </p>
        </div>
        <BookOpen className="mt-1 hidden h-5 w-5 text-[var(--color-surface-green,#5a7a62)] sm:block" strokeWidth={1.5} />
      </div>

      {contextPreview && (
        <p className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-[12px] leading-relaxed text-slate-500">
          Contexto enviado (recortado): {contextPreview}
          {patientContext.length > 280 ? "…" : ""}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFolderFilter(f.id)}
            className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-wider transition ${
              folderFilter === f.id
                ? "bg-[var(--color-surface-green,#5a7a62)] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => ask(s)}
            disabled={loading}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-[12px] text-slate-600 transition hover:border-[var(--color-bronze)] hover:text-[var(--color-bronze)] disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") ask();
          }}
          placeholder="Ej. técnicas para neuralgia cervicobraquial según escuela…"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[var(--color-bronze)] focus:bg-white focus:ring-2 focus:ring-[rgba(192,138,94,0.18)]"
        />
        <button
          type="button"
          onClick={() => ask()}
          disabled={loading || !question.trim()}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--color-surface-green,#5a7a62)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Preguntar
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {answer !== null && (
        <div className="mt-6 space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-6 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
            Respuesta OsteoRAG
          </p>
          <div className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-slate-800">
            {answer}
          </div>
          {citations.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
                Citas
              </p>
              <ul className="space-y-2">
                {citations.map((c, i) => (
                  <li
                    key={`${c.title}-${i}`}
                    className="rounded-xl border border-emerald-100 bg-white/80 px-4 py-3 text-[13px] text-slate-700"
                  >
                    <span className="font-medium text-slate-800">{c.title}</span>
                    {c.page != null && (
                      <span className="text-slate-400"> · p. {c.page}</span>
                    )}
                    <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-700">
                      {c.source_folder}
                    </span>
                    {c.excerpt && (
                      <p className="mt-1.5 text-[12px] leading-snug text-slate-500">
                        {c.excerpt.slice(0, 220)}
                        {c.excerpt.length > 220 ? "…" : ""}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[11px] italic text-emerald-700/70">
            Asistente de estudio con citas. No es diagnóstico ni sustituye tu criterio clínico.
          </p>
        </div>
      )}
    </div>
  );
}
