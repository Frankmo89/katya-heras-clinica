"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  ArrowLeft, Save, Plus, Trash2, Check, X,
  FileText, Image as ImageIcon, LayoutList, HelpCircle,
} from "lucide-react";

// ── Style constants ────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-sans text-[15px] text-[var(--color-text)] transition-colors focus:border-[var(--color-bronze)] focus:outline-none focus:ring-2 focus:ring-[rgba(192,138,94,0.15)]";
const labelCls =
  "mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)]";
const sectionCls =
  "rounded-3xl border border-slate-100 bg-white p-8 shadow-[var(--shadow-sm)]";
const addBtnCls =
  "inline-flex items-center gap-1.5 rounded-xl bg-[rgba(192,138,94,0.08)] px-4 py-2 text-xs font-medium text-[var(--color-bronze)] hover:bg-[rgba(192,138,94,0.15)] transition";

// ── Types ─────────────────────────────────────────────────────────────────
type TabId = "basica" | "multimedia" | "estructura" | "faqs";
interface TimelineStep { time: string; title: string; desc: string; }
interface FaqItem { question: string; answer: string; }

const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: "basica",     label: "Información Básica",     icon: FileText   },
  { id: "multimedia", label: "Multimedia",              icon: ImageIcon  },
  { id: "estructura", label: "Estructura de la Sesión", icon: LayoutList },
  { id: "faqs",       label: "Preguntas Frecuentes",    icon: HelpCircle },
];

const TONE_OPTIONS = [
  { value: "pink",  label: "Rosa",  bg: "#F7D9DA", accent: "#C07878" },
  { value: "green", label: "Verde", bg: "#E0F2F1", accent: "#4A9E95" },
  { value: "blue",  label: "Azul",  bg: "#E1F5FE", accent: "#4A8EC0" },
] as const;

// ── Storage upload ─────────────────────────────────────────────────────────
async function uploadToStorage(file: File): Promise<string> {
  const ext  = file.name.split(".").pop() ?? "jpg";
  const path = `services/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("service-images")
    .upload(path, file, { cacheControl: "3600" });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("service-images").getPublicUrl(path);
  return data.publicUrl;
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function EditarServicioPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  // UI state
  const [tab,     setTab]     = useState<TabId>("basica");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab 1 — Información Básica
  const [titleEs,    setTitleEs]    = useState("");
  const [subtitleEs, setSubtitleEs] = useState("");
  const [descEs,     setDescEs]     = useState("");
  const [duration,   setDuration]   = useState("");
  const [price,      setPrice]      = useState("");
  const [tone, setTone] = useState<"pink" | "green" | "blue" | "">("");

  // Tab 2 — Multimedia (existing URLs + new files)
  const [existingHeroUrl,     setExistingHeroUrl]     = useState<string | null>(null);
  const [heroFile,             setHeroFile]             = useState<File | null>(null);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
  const [galleryFiles,         setGalleryFiles]         = useState<File[]>([]);

  // Tab 3 — Estructura
  const [timeline, setTimeline] = useState<TimelineStep[]>([{ time: "", title: "", desc: "" }]);
  const [idealFor, setIdealFor] = useState<string[]>(["", ""]);
  const [notFor,   setNotFor]   = useState<string[]>(["", ""]);

  // Tab 4 — FAQs
  const [faqs, setFaqs] = useState<FaqItem[]>([{ question: "", answer: "" }]);

  // ── Load service ─────────────────────────────────────────────────────────
  const loadService = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !data) {
      setError("No se pudo cargar el servicio.");
      setLoading(false);
      return;
    }

    setTitleEs(data.title_es ?? "");
    setSubtitleEs(data.subtitle_es ?? "");
    setDescEs(data.description_es ?? "");
    setDuration(data.duration_minutes != null ? String(data.duration_minutes) : "");
    setPrice(data.price != null ? String(data.price) : "");
    setTone((data.tone as typeof tone) ?? "");

    setExistingHeroUrl(data.hero_image ?? null);
    setExistingGalleryUrls(data.gallery_images ?? []);

    if (Array.isArray(data.timeline) && data.timeline.length > 0)
      setTimeline(data.timeline as TimelineStep[]);
    if (Array.isArray(data.ideal_for) && data.ideal_for.length > 0)
      setIdealFor(data.ideal_for as string[]);
    if (Array.isArray(data.not_for) && data.not_for.length > 0)
      setNotFor(data.not_for as string[]);
    if (Array.isArray(data.faqs) && data.faqs.length > 0)
      setFaqs(data.faqs as FaqItem[]);

    setLoading(false);
  }, [id]);

  useEffect(() => { loadService(); }, [loadService]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  function updateStep(i: number, field: keyof TimelineStep, val: string) {
    setTimeline((p) => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  }

  function updateItem(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    i: number, val: string
  ) { setter((p) => p.map((s, idx) => idx === i ? val : s)); }

  function updateFaq(i: number, field: keyof FaqItem, val: string) {
    setFaqs((p) => p.map((f, idx) => idx === i ? { ...f, [field]: val } : f));
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!titleEs.trim()) {
      setError("El título en español es obligatorio.");
      setTab("basica");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      // Hero: upload new file if provided, otherwise keep existing URL
      let heroUrl: string | null = existingHeroUrl;
      if (heroFile) heroUrl = await uploadToStorage(heroFile);

      // Gallery: upload new files and append to retained existing URLs
      const newGalleryUrls: string[] = [];
      for (const file of galleryFiles) {
        newGalleryUrls.push(await uploadToStorage(file));
      }
      const allGalleryUrls = [...existingGalleryUrls, ...newGalleryUrls];

      // Clean arrays
      const cleanTimeline = timeline.filter((s) => s.title.trim() || s.desc.trim());
      const cleanIdealFor = idealFor.filter((s) => s.trim());
      const cleanNotFor   = notFor.filter((s)   => s.trim());
      const cleanFaqs     = faqs.filter((f)     => f.question.trim());

      const { error: dbError } = await supabase.from("services").update({
        title_es:         titleEs.trim(),
        title_en:         titleEs.trim()    || null,
        subtitle_es:      subtitleEs.trim() || null,
        subtitle_en:      subtitleEs.trim() || null,
        description_es:   descEs.trim()     || null,
        description_en:   descEs.trim()     || null,
        duration_minutes: duration          ? parseInt(duration, 10)  : null,
        price:            price             ? parseFloat(price)        : null,
        tone:             tone              || null,
        hero_image:       heroUrl,
        gallery_images:   allGalleryUrls.length   > 0 ? allGalleryUrls  : null,
        timeline:         cleanTimeline.length > 0 ? cleanTimeline : null,
        ideal_for:        cleanIdealFor.length > 0 ? cleanIdealFor : null,
        not_for:          cleanNotFor.length   > 0 ? cleanNotFor   : null,
        faqs:             cleanFaqs.length     > 0 ? cleanFaqs     : null,
      }).eq("id", id);

      if (dbError) throw new Error(dbError.message);

      fetch("/api/revalidate-public", { method: "POST" }).catch(() => {});
      setSaved(true);
      setTimeout(() => router.push("/admin/servicios"), 2200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el servicio.");
      setSaving(false);
    }
  }

  const activeTone = TONE_OPTIONS.find((t) => t.value === tone) ?? null;

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center p-24 text-sm text-slate-400">
        Cargando servicio…
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Page header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/admin/servicios"
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
        >
          <ArrowLeft size={14} /> Volver
        </Link>
        <div className="h-4 w-px bg-slate-200" />
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)] font-medium">
            Catálogo Clínico
          </span>
          <h1 className="mt-0.5 font-serif text-3xl text-slate-800">Editar Servicio</h1>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex overflow-x-auto border-b border-slate-100">
        {TABS.map(({ id: tabId, label, icon: Icon }) => {
          const active = tab === tabId;
          return (
            <button
              key={tabId}
              type="button"
              onClick={() => setTab(tabId)}
              className={`relative flex shrink-0 items-center gap-2 px-5 py-3.5 text-[13px] font-medium transition-all ${
                active
                  ? "text-[var(--color-bronze)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <Icon size={14} strokeWidth={1.5} />
              {label}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[var(--color-bronze)]" />
              )}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1 — Información Básica
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "basica" && (
          <>
            {/* Titles */}
            <section className={sectionCls}>
              <h2 className="mb-6 font-serif text-xl text-[var(--color-text)]">Nombre del Servicio</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Título *</label>
                  <input
                    type="text" required value={titleEs}
                    onChange={(e) => setTitleEs(e.target.value)}
                    placeholder="Osteopatía Estructural"
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Subtítulo</label>
                  <input
                    type="text" value={subtitleEs}
                    onChange={(e) => setSubtitleEs(e.target.value)}
                    placeholder="Equilibra tu cuerpo desde sus raíces"
                    className={inputCls}
                  />
                </div>
              </div>
            </section>

            {/* Descriptions */}
            <section className={sectionCls}>
              <h2 className="mb-6 font-serif text-xl text-[var(--color-text)]">Descripción</h2>
              <div>
                <label className={labelCls}>Descripción</label>
                <textarea
                  rows={6} value={descEs}
                  onChange={(e) => setDescEs(e.target.value)}
                  placeholder="Tratamiento que aborda las restricciones de movilidad del sistema músculo-esquelético…"
                  className={`${inputCls} resize-none`}
                />
              </div>
            </section>

            {/* Details + tone */}
            <section className={sectionCls}>
              <h2 className="mb-6 font-serif text-xl text-[var(--color-text)]">
                Detalles &amp; Presentación
              </h2>
              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>Duración (minutos)</label>
                  <input
                    type="number" min={1} value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="60" className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Precio (MXN)</label>
                  <input
                    type="number" min={0} step="0.01" value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1200" className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Color de Tarjeta</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as typeof tone)}
                    className={inputCls}
                  >
                    <option value="">Sin color</option>
                    {TONE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {activeTone && (
                <div className="mt-5 flex items-center gap-3">
                  <p className="text-xs text-[var(--color-text-muted)]">Vista previa:</p>
                  <span
                    className="rounded-full px-4 py-1.5 text-xs font-medium"
                    style={{ backgroundColor: activeTone.bg, color: activeTone.accent }}
                  >
                    ● {titleEs || "Servicio"} · {activeTone.label}
                  </span>
                </div>
              )}
            </section>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2 — Multimedia
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "multimedia" && (
          <>
            {/* Hero */}
            <section className={sectionCls}>
              <h2 className="mb-1 font-serif text-xl text-[var(--color-text)]">Imagen Principal</h2>
              <p className="mb-6 text-sm text-[var(--color-text-muted)]">
                Aparece en el hero de la página del servicio. Recomendado: 1400 × 800 px.
              </p>

              {/* Existing hero preview */}
              {existingHeroUrl && !heroFile && (
                <div className="mb-5 flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={existingHeroUrl}
                    alt="Imagen actual"
                    className="h-24 w-40 rounded-xl object-cover shadow-sm"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Imagen actual</p>
                    <button
                      type="button"
                      onClick={() => setExistingHeroUrl(null)}
                      className="mt-1.5 text-xs text-red-400 hover:text-red-500 transition"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}

              <label className={labelCls}>
                {existingHeroUrl && !heroFile ? "Reemplazar imagen" : "Seleccionar archivo"}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setHeroFile(e.target.files?.[0] ?? null)}
                className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[var(--color-text-muted)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--color-bronze)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-[var(--color-bronze-hover)]"
              />
              {heroFile && (
                <div className="mt-4 flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(heroFile)}
                    alt="Hero preview"
                    className="h-24 w-40 rounded-xl object-cover shadow-sm"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{heroFile.name}</p>
                    <p className="text-xs text-slate-400">{(heroFile.size / 1024).toFixed(0)} KB</p>
                    <button
                      type="button"
                      onClick={() => setHeroFile(null)}
                      className="mt-1.5 text-xs text-red-400 hover:text-red-500 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Gallery */}
            <section className={sectionCls}>
              <h2 className="mb-1 font-serif text-xl text-[var(--color-text)]">Galería de Imágenes</h2>
              <p className="mb-6 text-sm text-[var(--color-text-muted)]">
                Puedes seleccionar varios archivos a la vez. Haz clic en la x para quitar una imagen.
              </p>

              {/* Existing gallery */}
              {existingGalleryUrls.length > 0 && (
                <div className="mb-5">
                  <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    Imágenes actuales
                  </p>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                    {existingGalleryUrls.map((url, i) => (
                      <div key={i} className="group relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Imagen ${i + 1}`}
                          className="h-24 w-full rounded-xl object-cover shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setExistingGalleryUrls((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label className={labelCls}>Añadir imágenes</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setGalleryFiles((prev) => [...prev, ...files]);
                  e.target.value = "";
                }}
                className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[var(--color-text-muted)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--color-bronze)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-[var(--color-bronze-hover)]"
              />
              {galleryFiles.length > 0 && (
                <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                  {galleryFiles.map((file, i) => (
                    <div key={i} className="group relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-24 w-full rounded-xl object-cover shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setGalleryFiles((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
                      >
                        <X size={10} />
                      </button>
                      <p className="mt-1 truncate text-[11px] text-slate-400">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3 — Estructura de la Sesión
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "estructura" && (
          <>
            {/* Minuto a minuto */}
            <section className={sectionCls}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl text-[var(--color-text)]">Minuto a Minuto</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Describe cómo transcurre la sesión, paso a paso.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTimeline((p) => [...p, { time: "", title: "", desc: "" }])}
                  className={addBtnCls}
                >
                  <Plus size={13} /> Agregar Paso
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {timeline.map((step, i) => (
                  <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-bronze)] text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                      {timeline.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setTimeline((p) => p.filter((_, idx) => idx !== i))}
                          className="text-slate-300 transition hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
                      <div>
                        <label className={labelCls}>Tiempo</label>
                        <input
                          type="text" value={step.time}
                          onChange={(e) => updateStep(i, "time", e.target.value)}
                          placeholder="0–10 min" className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Título del Paso</label>
                        <input
                          type="text" value={step.title}
                          onChange={(e) => updateStep(i, "title", e.target.value)}
                          placeholder="Recepción y evaluación inicial" className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className={labelCls}>Descripción</label>
                      <textarea
                        rows={2} value={step.desc}
                        onChange={(e) => updateStep(i, "desc", e.target.value)}
                        placeholder="Conversación inicial, palpación general…"
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Ideal Para */}
            <section className={sectionCls}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl text-[var(--color-text)]">Ideal Para</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    ¿A quién beneficia este tratamiento?
                  </p>
                </div>
                <button type="button" onClick={() => setIdealFor((p) => [...p, ""])} className={addBtnCls}>
                  <Plus size={13} /> Agregar Ítem
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {idealFor.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-green)]">
                      <Check size={10} className="text-emerald-600" />
                    </span>
                    <input
                      type="text" value={item}
                      onChange={(e) => updateItem(setIdealFor, i, e.target.value)}
                      placeholder="Personas con dolor crónico de espalda"
                      className={inputCls}
                    />
                    {idealFor.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setIdealFor((p) => p.filter((_, idx) => idx !== i))}
                        className="shrink-0 text-slate-300 transition hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* No Recomendado Para */}
            <section className={sectionCls}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl text-[var(--color-text)]">No Recomendado Para</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Contraindicaciones o casos que deben evitarlo.
                  </p>
                </div>
                <button type="button" onClick={() => setNotFor((p) => [...p, ""])} className={addBtnCls}>
                  <Plus size={13} /> Agregar Ítem
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {notFor.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-pink)]">
                      <X size={10} className="text-red-400" />
                    </span>
                    <input
                      type="text" value={item}
                      onChange={(e) => updateItem(setNotFor, i, e.target.value)}
                      placeholder="Personas con fracturas recientes"
                      className={inputCls}
                    />
                    {notFor.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setNotFor((p) => p.filter((_, idx) => idx !== i))}
                        className="shrink-0 text-slate-300 transition hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 4 — Preguntas Frecuentes
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "faqs" && (
          <section className={sectionCls}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl text-[var(--color-text)]">Preguntas Frecuentes</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Resuelve las dudas más comunes sobre este servicio.
                </p>
              </div>
              <button type="button" onClick={() => setFaqs((p) => [...p, { question: "", answer: "" }])} className={addBtnCls}>
                <Plus size={13} /> Agregar FAQ
              </button>
            </div>

            <div className="flex flex-col gap-5">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-bronze)]">
                      FAQ {i + 1}
                    </span>
                    {faqs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFaqs((p) => p.filter((_, idx) => idx !== i))}
                        className="text-slate-300 transition hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className={labelCls}>Pregunta</label>
                      <input
                        type="text" value={faq.question}
                        onChange={(e) => updateFaq(i, "question", e.target.value)}
                        placeholder="¿Cuántas sesiones necesito?" className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Respuesta</label>
                      <textarea
                        rows={3} value={faq.answer}
                        onChange={(e) => updateFaq(i, "answer", e.target.value)}
                        placeholder="Depende de tu condición. Generalmente entre 3 y 5 sesiones…"
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Error ─────────────────────────────────────────────────────────── */}
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-500">
            {error}
          </p>
        )}

        {/* ── Persistent footer: save button ────────────────────────────────── */}
        <div className="flex items-center justify-between pb-6">
          <p className="text-xs text-[var(--color-text-muted)]">* Campos obligatorios</p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-bronze)] px-7 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-bronze-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Guardando…
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── Success overlay ─────────────────────────────────────────────────── */}
      {saved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-white px-12 py-10 shadow-[var(--shadow-lg)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-green)]">
              <Check size={28} className="text-emerald-500" strokeWidth={2.5} />
            </div>
            <p className="font-serif text-2xl text-[var(--color-text)]">¡Servicio actualizado!</p>
            <p className="text-sm font-medium text-slate-600">{titleEs}</p>
            <p className="text-xs text-slate-400">Redirigiendo al catálogo…</p>
          </div>
        </div>
      )}
    </div>
  );
}
