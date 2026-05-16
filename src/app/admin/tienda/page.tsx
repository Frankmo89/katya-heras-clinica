"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Plus, ShoppingBag, Tag, Layers } from "lucide-react";

interface Product {
  id: string;
  title_es: string;
  title_en: string | null;
  category: string | null;
  price: number | null;
  stock: number | null;
  card_style: string | null;
  tone: string | null;
}

const TONE_BG: Record<string, string> = {
  pink:   "var(--color-surface-pink)",
  green:  "var(--color-surface-green)",
  blue:   "var(--color-surface-blue)",
  bronze: "rgba(192,138,94,0.08)",
};

const TONE_ACCENT: Record<string, string> = {
  pink:   "#C07878",
  green:  "#4A9E95",
  blue:   "#4A8EC0",
  bronze: "var(--color-bronze)",
};

export default function TiendaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("products")
      .select("id, title_es, title_en, category, price, stock, card_style, tone")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setProducts(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)] font-medium">
            Catálogo de Productos
          </span>
          <h1 className="mt-2 font-serif text-4xl text-slate-800">Tienda</h1>
        </div>
        <Link
          href="/admin/tienda/nuevo"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-bronze)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-bronze-hover)]"
        >
          <Plus size={16} />
          Nuevo Producto
        </Link>
      </div>

      {/* States */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-slate-400">
          Cargando productos…
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-slate-100 bg-white p-16 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgba(192,138,94,0.08)]">
            <ShoppingBag size={28} className="text-[var(--color-bronze)]" strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 font-serif text-2xl text-slate-700">Sin productos aún</h2>
          <p className="max-w-xs text-sm leading-relaxed text-[var(--color-text-muted)]">
            Añade tu primer producto para que aparezca en la tienda pública.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const bg     = p.tone ? (TONE_BG[p.tone]     ?? "var(--color-background-soft)") : "var(--color-background-soft)";
            const accent = p.tone ? (TONE_ACCENT[p.tone] ?? "var(--color-bronze)")          : "var(--color-bronze)";
            return (
              <div
                key={p.id}
                style={{ backgroundColor: bg }}
                className="group flex flex-col gap-4 rounded-3xl border border-white/60 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition hover:shadow-[0_4px_20px_rgba(0,0,0,0.09)]"
              >
                {/* Accent dot + EN title */}
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
                  <span
                    className="text-[11px] uppercase tracking-[0.16em] font-medium"
                    style={{ color: accent }}
                  >
                    {p.title_en ?? "—"}
                  </span>
                </div>

                {/* Spanish title */}
                <h3 className="font-serif text-xl leading-snug text-[var(--color-text)]">
                  {p.title_es}
                </h3>

                {/* Meta row */}
                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--color-text-muted)]">
                  {p.category && (
                    <span className="flex items-center gap-1.5">
                      <Tag size={13} strokeWidth={1.5} />
                      {p.category}
                    </span>
                  )}
                  {p.price != null && (
                    <span className="flex items-center gap-1.5 font-medium" style={{ color: accent }}>
                      {Number(p.price).toLocaleString("es-MX", {
                        style: "currency",
                        currency: "MXN",
                        minimumFractionDigits: 0,
                      })}
                    </span>
                  )}
                  {p.stock != null && (
                    <span className="flex items-center gap-1.5">
                      <Layers size={13} strokeWidth={1.5} />
                      {p.stock} uds.
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
