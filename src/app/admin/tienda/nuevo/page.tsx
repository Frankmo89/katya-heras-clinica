"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  ArrowLeft, Save, Plus, Trash2, Check, X,
  FileText, Image as ImageIcon, Palette, List,
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
type TabId = "informacion" | "multimedia" | "diseno" | "detalles";
interface DetailItem { label: string; value: string; }

const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: "informacion", label: "Información",  icon: FileText  },
  { id: "multimedia",  label: "Multimedia",   icon: ImageIcon },
  { id: "diseno",      label: "Diseño",       icon: Palette   },
  { id: "detalles",    label: "Detalles",     icon: List      },
];

const CARD_STYLE_OPTIONS = [
  { value: "editorial", label: "Editorial",  desc: "Gran imagen + tipografía serif destacada" },
  { value: "minimal",   label: "Minimal",    desc: "Espaciado limpio, sin ornamentos"          },
  { value: "polaroid",  label: "Polaroid",   desc: "Marco blanco con sombra fotográfica"       },
];

const TONE_OPTIONS = [
  { value: "pink",   label: "Rosa",   bg: "#F7D9DA", accent: "#C07878" },
  { value: "green",  label: "Verde",  bg: "#E0F2F1", accent: "#4A9E95" },
  { value: "blue",   label: "Azul",   bg: "#E1F5FE", accent: "#4A8EC0" },
  { value: "bronze", label: "Bronze", bg: "rgba(192,138,94,0.10)", accent: "var(--color-bronze)" },
] as const;

const CATEGORY_OPTIONS = [
  "Aceites & Aromaterapia",
  "Suplementos",
  "Herramientas de Terapia",
  "Libros & Guías",
  "Kits & Sets",
  "Ropa & Accesorios",
  "Otro",
];

// ── Storage upload ─────────────────────────────────────────────────────────
async function uploadToStorage(file: File): Promise<string> {
  const ext  = file.name.split(".").pop() ?? "jpg";
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("shop-images")
    .upload(path, file, { cacheControl: "3600" });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("shop-images").getPublicUrl(path);
  return data.publicUrl;
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function NuevoProductoPage() {
  const router = useRouter();

  // UI state
  const [tab,    setTab]    = useState<TabId>("informacion");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  // Tab 1 — Información
  const [titleEs,   setTitleEs]   = useState("");
  const [titleEn,   setTitleEn]   = useState("");
  const [descEs,    setDescEs]    = useState("");
  const [descEn,    setDescEn]    = useState("");
  const [category,  setCategory]  = useState("");
  const [price,     setPrice]     = useState("");
  const [stock,     setStock]     = useState("");

  // Tab 2 — Multimedia
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Tab 3 — Diseño
  const [cardStyle, setCardStyle] = useState<"editorial" | "minimal" | "polaroid" | "">("");
  const [tone,      setTone]      = useState<"pink" | "green" | "blue" | "bronze" | "">("");

  // Tab 4 — Detalles
  const [details, setDetails] = useState<DetailItem[]>([{ label: "", value: "" }]);

  // ── Detail helpers ──────────────────────────────────────────────────────
  function updateDetail(i: number, field: keyof DetailItem, val: string) {
    setDetails((p) => p.map((d, idx) => idx === i ? { ...d, [field]: val } : d));
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!titleEs.trim()) {
      setError("El título en español es obligatorio.");
      setTab("informacion");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      // Upload images sequentially to avoid rate limits
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        imageUrls.push(await uploadToStorage(file));
      }

      // Clean details
      const cleanDetails = details.filter((d) => d.label.trim() || d.value.trim());

      const { error: dbError } = await supabase.from("products").insert({
        title_es:       titleEs.trim(),
        title_en:       titleEn.trim()   || null,
        description_es: descEs.trim()    || null,
        description_en: descEn.trim()    || null,
        category:       category         || null,
        price:          price            ? parseFloat(price)    : null,
        stock:          stock            ? parseInt(stock, 10)  : null,
        card_style:     cardStyle        || null,
        tone:           tone             || null,
        images:         imageUrls.length > 0 ? imageUrls    : null,
        details:        cleanDetails.length  > 0 ? cleanDetails : null,
      });

      if (dbError) throw new Error(dbError.message);

      setSaved(true);
      setTimeout(() => router.push("/admin/tienda"), 2200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el producto.");
      setSaving(false);
    }
  }

  const activeTone = TONE_OPTIONS.find((t) => t.value === tone) ?? null;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Page header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/admin/tienda"
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
        >
          <ArrowLeft size={14} /> Volver
        </Link>
        <div className="h-4 w-px bg-slate-200" />
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)] font-medium">
            Catálogo de Productos
          </span>
          <h1 className="mt-0.5 font-serif text-3xl text-slate-800">Crear Producto</h1>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex overflow-x-auto border-b border-slate-100">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
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
            TAB 1 — Información
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "informacion" && (
          <>
            {/* Titles */}
            <section className={sectionCls}>
              <h2 className="mb-6 font-serif text-xl text-[var(--color-text)]">Nombre del Producto</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Título en Español *</label>
                  <input
                    type="text" required value={titleEs}
                    onChange={(e) => setTitleEs(e.target.value)}
                    placeholder="Aceite de Lavanda Orgánico"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Título en Inglés</label>
                  <input
                    type="text" value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="Organic Lavender Oil"
                    className={inputCls}
                  />
                </div>
              </div>
            </section>

            {/* Descriptions */}
            <section className={sectionCls}>
              <h2 className="mb-6 font-serif text-xl text-[var(--color-text)]">Descripción</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Descripción en Español</label>
                  <textarea
                    rows={5} value={descEs}
                    onChange={(e) => setDescEs(e.target.value)}
                    placeholder="Aceite esencial de lavanda 100% puro, ideal para aromaterapia y masajes relajantes…"
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Descripción en Inglés</label>
                  <textarea
                    rows={5} value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    placeholder="100% pure lavender essential oil, ideal for aromatherapy and relaxing massage…"
                    className={`${inputCls} resize-none`}
                  />
                </div>
              </div>
            </section>

            {/* Category, Price, Stock */}
            <section className={sectionCls}>
              <h2 className="mb-6 font-serif text-xl text-[var(--color-text)]">Detalles Comerciales</h2>
              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Seleccionar…</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Precio (MXN)</label>
                  <input
                    type="number" min={0} step="0.01" value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="350"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Stock (unidades)</label>
                  <input
                    type="number" min={0} step="1" value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="20"
                    className={inputCls}
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2 — Multimedia
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "multimedia" && (
          <section className={sectionCls}>
            <h2 className="mb-1 font-serif text-xl text-[var(--color-text)]">Imágenes del Producto</h2>
            <p className="mb-6 text-sm text-[var(--color-text-muted)]">
              Puedes seleccionar varias imágenes a la vez. La primera imagen será la principal en las tarjetas. Recomendado: 800 × 800 px.
            </p>
            <label className={labelCls}>Seleccionar archivos</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setImageFiles((prev) => [...prev, ...files]);
                e.target.value = "";
              }}
              className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[var(--color-text-muted)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--color-bronze)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-[var(--color-bronze-hover)]"
            />
            {imageFiles.length > 0 && (
              <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {imageFiles.map((file, i) => (
                  <div key={i} className="group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-24 w-full rounded-xl object-cover shadow-sm"
                    />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 rounded-full bg-[var(--color-bronze)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                        Principal
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
                    >
                      <X size={10} />
                    </button>
                    <p className="mt-1 truncate text-[11px] text-slate-400">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
            {imageFiles.length === 0 && (
              <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
                <ImageIcon size={28} strokeWidth={1} className="mb-3 text-slate-300" />
                <p className="text-sm text-slate-400">No hay imágenes seleccionadas</p>
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3 — Diseño
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "diseno" && (
          <>
            {/* Card Style */}
            <section className={sectionCls}>
              <h2 className="mb-2 font-serif text-xl text-[var(--color-text)]">Estilo de Tarjeta</h2>
              <p className="mb-6 text-sm text-[var(--color-text-muted)]">
                Define cómo se mostrará este producto en la tienda pública.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {CARD_STYLE_OPTIONS.map((opt) => {
                  const selected = cardStyle === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCardStyle(opt.value as typeof cardStyle)}
                      className={`rounded-2xl border-2 p-5 text-left transition ${
                        selected
                          ? "border-[var(--color-bronze)] bg-[rgba(192,138,94,0.06)]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <p className={`text-sm font-semibold ${selected ? "text-[var(--color-bronze)]" : "text-slate-700"}`}>
                        {opt.label}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">{opt.desc}</p>
                      {selected && (
                        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[var(--color-bronze)] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                          <Check size={9} /> Seleccionado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Tone */}
            <section className={sectionCls}>
              <h2 className="mb-2 font-serif text-xl text-[var(--color-text)]">Tono de Color</h2>
              <p className="mb-6 text-sm text-[var(--color-text-muted)]">
                El color de fondo que se usará en la tarjeta del producto.
              </p>
              <div className="grid gap-4 sm:grid-cols-4">
                {TONE_OPTIONS.map((t) => {
                  const selected = tone === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(t.value as typeof tone)}
                      style={{ backgroundColor: t.bg, borderColor: selected ? t.accent : "transparent" }}
                      className={`flex flex-col items-center gap-2.5 rounded-2xl border-2 p-5 transition ${
                        selected ? "shadow-[0_0_0_3px_rgba(192,138,94,0.15)]" : "hover:border-slate-200"
                      }`}
                    >
                      <span
                        className="h-6 w-6 rounded-full shadow-sm"
                        style={{ backgroundColor: t.accent }}
                      />
                      <span className="text-xs font-medium" style={{ color: t.accent }}>
                        {t.label}
                      </span>
                      {selected && <Check size={11} style={{ color: t.accent }} />}
                    </button>
                  );
                })}
              </div>

              {activeTone && (
                <div className="mt-6 flex items-center gap-3">
                  <p className="text-xs text-[var(--color-text-muted)]">Vista previa de tarjeta:</p>
                  <span
                    className="rounded-full px-4 py-1.5 text-xs font-medium"
                    style={{ backgroundColor: activeTone.bg, color: activeTone.accent }}
                  >
                    ● {titleEs || "Producto"} · {activeTone.label}
                  </span>
                </div>
              )}
            </section>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 4 — Detalles
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "detalles" && (
          <section className={sectionCls}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl text-[var(--color-text)]">Características del Producto</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Añade ingredientes, dimensiones, beneficios u otras especificaciones técnicas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetails((p) => [...p, { label: "", value: "" }])}
                className={addBtnCls}
              >
                <Plus size={13} /> Agregar Ítem
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {details.map((detail, i) => (
                <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-bronze)] text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    {details.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDetails((p) => p.filter((_, idx) => idx !== i))}
                        className="text-slate-300 transition hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Etiqueta</label>
                      <input
                        type="text" value={detail.label}
                        onChange={(e) => updateDetail(i, "label", e.target.value)}
                        placeholder="Ingrediente principal"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Valor</label>
                      <input
                        type="text" value={detail.value}
                        onChange={(e) => updateDetail(i, "value", e.target.value)}
                        placeholder="Lavandula angustifolia 100%"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {details.length === 0 && (
              <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center">
                <p className="text-sm text-slate-400">
                  Haz clic en &quot;Agregar Ítem&quot; para añadir la primera característica.
                </p>
              </div>
            )}
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
                Guardar Producto
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
            <p className="font-serif text-2xl text-[var(--color-text)]">¡Producto guardado!</p>
            <p className="text-sm font-medium text-slate-600">{titleEs}</p>
            <p className="text-xs text-slate-400">Redirigiendo a la tienda…</p>
          </div>
        </div>
      )}
    </div>
  );
}
