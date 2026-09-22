"use client";

import { useState } from "react";
import { authHeaders } from "@/lib/authFetch";
import {
  Megaphone,
  Loader2,
  Copy,
  Check,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

type FolderFilter = "all" | "escuela" | "libros" | "tesis";

interface Pack {
  topic: string;
  estrategia?: {
    objetivo?: string;
    angulo?: string;
    publico?: string;
    calendario_sugerido?: string[];
  };
  articulo_corto?: string;
  datos_curiosos?: string[];
  tips_en_casa?: string[];
  instagram_historia?: {
    texto_pantalla?: string;
    texto_apoyo?: string;
    cta?: string;
  };
  instagram_post?: {
    caption?: string;
    hashtags?: string[];
    idea_visual?: string;
  };
  facebook_post?: { texto?: string; cta?: string };
  disclaimer?: string;
  citations?: { title?: string; source_folder?: string }[];
  eventId?: string;
  model?: string;
  prompt_version?: string;
  error?: string;
}

const FILTERS: { id: FolderFilter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "escuela", label: "Escuela" },
  { id: "libros", label: "Libros" },
  { id: "tesis", label: "Tesis" },
];

const SUGGESTIONS = [
  "Osteopatía visceral",
  "Masaje tailandés para espalda",
  "Kinesiotape / VNM lumbar",
  "Cuidados de cuello y cervicales",
  "Fascia / liberación miofascial",
];

async function markPublished(
  eventId: string | undefined,
  text: string,
  channel: string,
) {
  if (!eventId || !text.trim()) return;
  try {
    await fetch("/api/ai/publicidad/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await authHeaders()),
      },
      body: JSON.stringify({ eventId, text, channel }),
    });
  } catch {
    // fire-and-forget for UX; server already soft-fails
  }
}

function CopyBtn({
  text,
  eventId,
  channel,
}: {
  text: string;
  eventId?: string;
  channel: string;
}) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        void markPublished(eventId, text, channel);
        setTimeout(() => setOk(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] text-slate-500 hover:border-[var(--color-bronze)] hover:text-[var(--color-bronze)]"
    >
      {ok ? <Check size={12} /> : <Copy size={12} />}
      {ok ? "Copiado" : "Copiar"}
    </button>
  );
}

function Card({
  title,
  children,
  copyText,
  eventId,
  channel,
}: {
  title: string;
  children: React.ReactNode;
  copyText?: string;
  eventId?: string;
  channel?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bronze)]">
          {title}
        </h3>
        {copyText ? (
          <CopyBtn
            text={copyText}
            eventId={eventId}
            channel={channel || "copy"}
          />
        ) : null}
      </div>
      {children}
    </div>
  );
}

function OutcomeForm({ eventId }: { eventId: string }) {
  const [leads, setLeads] = useState("");
  const [bookings, setBookings] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setErr(null);
    setSaved(false);
    try {
      const res = await fetch("/api/ai/publicidad/outcome", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          eventId,
          leads: leads === "" ? null : Number(leads),
          bookings: bookings === "" ? null : Number(bookings),
          notes: notes || null,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      setSaved(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bronze)]">
        Resultado de la campaña (opcional)
      </h3>
      <p className="mt-1 text-[12px] text-slate-500">
        Tras publicar, anota leads / citas para el loop de aprendizaje.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-[12px] text-slate-600">
          Leads
          <input
            type="number"
            min={0}
            value={leads}
            onChange={(e) => setLeads(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-bronze)]"
          />
        </label>
        <label className="text-[12px] text-slate-600">
          Citas
          <input
            type="number"
            min={0}
            value={bookings}
            onChange={(e) => setBookings(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-bronze)]"
          />
        </label>
        <label className="text-[12px] text-slate-600 sm:col-span-1">
          Notas
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. IG stories funcionó"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-bronze)]"
          />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-[var(--color-bronze)] px-4 py-2 text-[12px] font-medium text-white hover:bg-[var(--color-bronze-hover)] disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar resultado"}
        </button>
        {saved && (
          <span className="text-[12px] text-emerald-700">Guardado ✓</span>
        )}
        {err && <span className="text-[12px] text-red-600">{err}</span>}
      </div>
    </div>
  );
}

export default function PublicidadPage() {
  const [topic, setTopic] = useState("");
  const [folderFilter, setFolderFilter] = useState<FolderFilter>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pack, setPack] = useState<Pack | null>(null);
  const [rated, setRated] = useState<-1 | 1 | null>(null);

  async function generate(t?: string) {
    const final = (t ?? topic).trim();
    if (!final || loading) return;
    setTopic(final);
    setLoading(true);
    setError(null);
    setPack(null);
    setRated(null);
    try {
      const res = await fetch("/api/ai/publicidad", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ topic: final, folderFilter }),
      });
      const json = (await res.json()) as Pack;
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      setPack(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  const igCaption = pack?.instagram_post
    ? `${pack.instagram_post.caption || ""}\n\n${(pack.instagram_post.hashtags || []).join(" ")}`
    : "";

  const citationTitles =
    pack?.citations?.map((c) => c.title || "").filter(Boolean) || [];

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-bronze)]">
          Marketing · Corpus
        </p>
        <h1 className="mt-2 font-serif text-3xl text-slate-800">Publicidad</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
          Saca información del material de estudio (OsteoRAG) y genera estrategia,
          artículo corto, datos curiosos, tips en casa e historias / posts para
          Instagram y Facebook. No diagnostica ni inventa estudios.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFolderFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-wider transition ${
                folderFilter === f.id
                  ? "bg-[var(--color-bronze)] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={loading}
              onClick={() => generate(s)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-[12px] text-slate-600 hover:border-[var(--color-bronze)] hover:text-[var(--color-bronze)] disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder="Ej. osteopatía visceral, kinesiotape lumbar…"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[var(--color-bronze)] focus:bg-white focus:ring-2 focus:ring-[rgba(192,138,94,0.18)]"
          />
          <button
            type="button"
            onClick={() => generate()}
            disabled={loading || !topic.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-bronze)] px-6 py-3 text-sm font-medium text-white hover:bg-[var(--color-bronze-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generando…
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generar campaña
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {pack && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Megaphone size={16} className="text-[var(--color-bronze)]" />
            Tema: <span className="font-medium text-slate-800">{pack.topic}</span>
            {pack.model && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                {pack.model}
                {pack.prompt_version ? ` · ${pack.prompt_version}` : ""}
              </span>
            )}
          </div>

          {pack.estrategia && (
            <Card title="Estrategia">
              <div className="space-y-2 text-sm text-slate-700">
                {pack.estrategia.objetivo && (
                  <p>
                    <span className="font-medium">Objetivo: </span>
                    {pack.estrategia.objetivo}
                  </p>
                )}
                {pack.estrategia.angulo && (
                  <p>
                    <span className="font-medium">Ángulo: </span>
                    {pack.estrategia.angulo}
                  </p>
                )}
                {pack.estrategia.publico && (
                  <p>
                    <span className="font-medium">Público: </span>
                    {pack.estrategia.publico}
                  </p>
                )}
                {!!pack.estrategia.calendario_sugerido?.length && (
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {pack.estrategia.calendario_sugerido.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {pack.articulo_corto && (
              <Card
                title="Artículo / newsletter"
                copyText={pack.articulo_corto}
                eventId={pack.eventId}
                channel="articulo"
              >
                <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate-700">
                  {pack.articulo_corto}
                </p>
              </Card>
            )}
            <div className="space-y-5">
              {!!pack.datos_curiosos?.length && (
                <Card title="Datos curiosos">
                  <ul className="space-y-2 text-sm text-slate-700">
                    {pack.datos_curiosos.map((d, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-bronze)]" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
              {!!pack.tips_en_casa?.length && (
                <Card title="Cosas para hacer en casa">
                  <ul className="space-y-2 text-sm text-slate-700">
                    {pack.tips_en_casa.map((d, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {pack.instagram_historia && (
              <Card
                title="Historia Instagram"
                eventId={pack.eventId}
                channel="ig_story"
                copyText={[
                  pack.instagram_historia.texto_pantalla,
                  pack.instagram_historia.texto_apoyo,
                  pack.instagram_historia.cta,
                ]
                  .filter(Boolean)
                  .join("\n")}
              >
                <p className="font-serif text-lg text-slate-800">
                  {pack.instagram_historia.texto_pantalla}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {pack.instagram_historia.texto_apoyo}
                </p>
                <p className="mt-3 text-[12px] font-medium text-[var(--color-bronze)]">
                  {pack.instagram_historia.cta}
                </p>
              </Card>
            )}
            {pack.instagram_post && (
              <Card
                title="Post Instagram"
                copyText={igCaption}
                eventId={pack.eventId}
                channel="ig_post"
              >
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {pack.instagram_post.caption}
                </p>
                <p className="mt-3 text-[12px] text-slate-500">
                  {(pack.instagram_post.hashtags || []).join(" ")}
                </p>
                {pack.instagram_post.idea_visual && (
                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[12px] text-slate-500">
                    Visual: {pack.instagram_post.idea_visual}
                  </p>
                )}
              </Card>
            )}
            {pack.facebook_post && (
              <Card
                title="Post Facebook"
                eventId={pack.eventId}
                channel="fb"
                copyText={`${pack.facebook_post.texto || ""}\n\n${pack.facebook_post.cta || ""}`}
              >
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {pack.facebook_post.texto}
                </p>
                <p className="mt-3 text-[12px] font-medium text-[var(--color-bronze)]">
                  {pack.facebook_post.cta}
                </p>
              </Card>
            )}
          </div>

          {!!pack.citations?.length && (
            <Card title="Fuentes del corpus">
              <ul className="space-y-1 text-[12px] text-slate-500">
                {pack.citations.slice(0, 8).map((c, i) => (
                  <li key={i}>
                    {c.title}
                    {c.source_folder ? ` · ${c.source_folder}` : ""}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-500">¿Sirvió esta campaña?</span>
            <button
              type="button"
              disabled={rated !== null}
              onClick={async () => {
                setRated(1);
                await fetch("/api/ai/feedback", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(await authHeaders()),
                  },
                  body: JSON.stringify({
                    rating: 1,
                    source: "publicidad",
                    relatedEventId: pack.eventId,
                    topicOrQuestion: pack.topic,
                    outputPreview: pack.articulo_corto,
                  }),
                });
              }}
              className={`rounded-lg border px-2.5 py-1 text-[12px] ${rated === 1 ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              <ThumbsUp size={12} className="inline" /> Sí
            </button>
            <button
              type="button"
              disabled={rated !== null}
              onClick={async () => {
                setRated(-1);
                await fetch("/api/ai/feedback", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(await authHeaders()),
                  },
                  body: JSON.stringify({
                    rating: -1,
                    source: "publicidad",
                    relatedEventId: pack.eventId,
                    topicOrQuestion: pack.topic,
                    outputPreview: pack.articulo_corto,
                    downvoted_sources: citationTitles.length
                      ? citationTitles
                      : undefined,
                    citationTitles: citationTitles.length
                      ? citationTitles
                      : undefined,
                  }),
                });
              }}
              className={`rounded-lg border px-2.5 py-1 text-[12px] ${rated === -1 ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              <ThumbsDown size={12} className="inline" /> No
            </button>
          </div>

          {pack.eventId && <OutcomeForm eventId={pack.eventId} />}

          {pack.disclaimer && (
            <p className="text-[11px] italic text-slate-400">{pack.disclaimer}</p>
          )}
        </div>
      )}
    </div>
  );
}
