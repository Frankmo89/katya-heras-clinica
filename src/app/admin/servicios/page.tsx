"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Plus, Clock, Banknote, Stethoscope, Pencil, Trash2 } from "lucide-react";

interface Service {
  id: string;
  title_es: string;
  title_en: string | null;
  duration_minutes: number | null;
  price: number | null;
  tone: "pink" | "green" | "blue" | null;
}

const TONE_BG: Record<string, string> = {
  pink:  "var(--color-surface-pink)",
  green: "var(--color-surface-green)",
  blue:  "var(--color-surface-blue)",
};

const TONE_DOT: Record<string, string> = {
  pink:  "#C07878",
  green: "#4A9E95",
  blue:  "#4A8EC0",
};

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("services")
      .select("id, title_es, title_en, duration_minutes, price, tone")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setServices(data ?? []);
        setLoading(false);
      });
  }, []);

  async function handleDelete(id: string, titleEs: string) {
    if (!window.confirm(`¿Eliminar el servicio "${titleEs}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (!error) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      fetch("/api/revalidate-public", { method: "POST" }).catch(() => {});
    }
    setDeleting(null);
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)] font-medium">
            Catálogo Clínico
          </span>
          <h1 className="mt-2 font-serif text-4xl text-slate-800">
            Servicios &amp; Tratamientos
          </h1>
        </div>
        <Link
          href="/admin/servicios/nuevo"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-bronze)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-bronze-hover)]"
        >
          <Plus size={16} />
          Nuevo Servicio
        </Link>
      </div>

      {/* States */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-slate-400">
          Cargando servicios…
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-slate-100 bg-white p-16 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgba(192,138,94,0.08)]">
            <Stethoscope size={28} className="text-[var(--color-bronze)]" strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 font-serif text-2xl text-slate-700">Sin servicios aún</h2>
          <p className="max-w-xs text-sm leading-relaxed text-[var(--color-text-muted)]">
            Añade tu primer tratamiento para que aparezca en la página pública.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const bg     = s.tone ? TONE_BG[s.tone]  : "var(--color-background-soft)";
            const accent = s.tone ? TONE_DOT[s.tone] : "var(--color-bronze)";
            return (
              <div
                key={s.id}
                style={{ backgroundColor: bg }}
                className="group flex flex-col gap-4 rounded-3xl border border-white/60 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition hover:shadow-[0_4px_20px_rgba(0,0,0,0.09)]"
              >
                {/* Tone dot + EN label */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                    <span
                      className="text-[11px] uppercase tracking-[0.16em] font-medium"
                      style={{ color: accent }}
                    >
                      {s.title_en ?? "—"}
                    </span>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/admin/servicios/${s.id}`}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-white/70 text-slate-500 hover:text-[var(--color-bronze)] hover:bg-white transition"
                      title="Editar"
                    >
                      <Pencil size={13} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id, s.title_es)}
                      disabled={deleting === s.id}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-white/70 text-slate-500 hover:text-red-500 hover:bg-white transition disabled:opacity-50"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Spanish title */}
                <h3 className="font-serif text-xl leading-snug text-[var(--color-text)]">
                  {s.title_es}
                </h3>

                {/* Meta row */}
                <div className="mt-auto flex items-center gap-5 text-sm text-[var(--color-text-muted)]">
                  {s.duration_minutes != null && (
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} strokeWidth={1.5} />
                      {s.duration_minutes} min
                    </span>
                  )}
                  {s.price != null && (
                    <span className="flex items-center gap-1.5">
                      <Banknote size={13} strokeWidth={1.5} />
                      {Number(s.price).toLocaleString("es-MX", {
                        style: "currency",
                        currency: "MXN",
                        minimumFractionDigits: 0,
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
