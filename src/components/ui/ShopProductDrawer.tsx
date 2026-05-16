"use client";

import { useState } from "react";
import { X, Minus, Plus, ArrowRight } from "lucide-react";
import type { ShopProduct, ProductTone } from "@/data/shop";
import { SHOP_CATEGORIES } from "@/data/shop";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";

const toneVar: Record<ProductTone, string> = {
  pink:   "var(--color-surface-pink)",
  green:  "var(--color-surface-green)",
  blue:   "var(--color-surface-blue)",
  bronze: "rgba(192, 138, 94, 0.15)",
};

const COPY = {
  es: {
    ritual:     "Ritual de uso",
    ritualDesc: "Encuentra una hora sin pendientes. Apaga el teléfono. Respira tres veces antes de empezar.",
    addToCart:  "Llevar a casa",
  },
  en: {
    ritual:     "Use ritual",
    ritualDesc: "Find an hour free of tasks. Turn off your phone. Take three breaths before you begin.",
    addToCart:  "Take home",
  },
};

interface ShopProductDrawerProps {
  p: ShopProduct | null;
  onClose: () => void;
  onAdd: (p: ShopProduct, qty: number) => void;
}

export function ShopProductDrawer({ p, onClose, onAdd }: ShopProductDrawerProps) {
  const [qty, setQty] = useState(1);
  const { lang } = useLanguage();
  const dc = COPY[lang];

  if (!p) return null;

  const swatch   = toneVar[p.tone] ?? "var(--color-surface-blue)";
  const catLabel = SHOP_CATEGORIES.find((c) => c.id === p.cat)?.[lang] ?? "";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-[rgba(30,41,59,0.32)]"
      />

      {/* Drawer panel */}
      <div className="fixed bottom-0 right-0 top-0 z-[51] flex w-[min(560px,92vw)] flex-col overflow-auto bg-[var(--color-background)] shadow-[-12px_0_40px_rgba(30,41,59,0.12)]">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-[1] flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[rgba(30,41,59,0.1)] bg-[var(--color-background)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <X size={14} strokeWidth={1.5} />
        </button>

        {/* Hero image */}
        <div
          className="flex aspect-[4/3] shrink-0 items-center justify-center font-serif text-[140px] text-black/[0.06]"
          style={{ background: `linear-gradient(135deg, ${swatch} 0%, #FAFAF8 100%)` }}
        >
          {p.name[lang].charAt(0)}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6 px-11 py-10">

          {/* Category eyebrow */}
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
            {catLabel}
          </p>

          <h2 className="m-0 font-serif text-[clamp(2rem,3vw,2.5rem)] font-light leading-[1.15] text-[var(--color-text)]">
            {p.name[lang]}
          </h2>

          <p className="m-0 text-base leading-[1.7] text-[var(--color-text-muted)]">
            {p.story[lang]}
          </p>

          {/* Price + size */}
          <div className="flex items-baseline justify-between border-t border-[rgba(30,41,59,0.08)] pt-2">
            <span className="font-serif text-3xl text-[var(--color-text)]">
              ${p.price.toLocaleString("es-MX")}{" "}
              <span className="font-sans text-[13px] tracking-[0.06em] text-[var(--color-text-muted)]">MXN</span>
            </span>
            <span className="text-[12px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              {p.size}
            </span>
          </div>

          {/* Ritual de uso */}
          <div className="rounded-xl bg-[var(--color-background-soft)] px-6 py-[22px]">
            <p className="mb-2.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
              {dc.ritual}
            </p>
            <p className="m-0 text-[14px] leading-[1.65] text-[var(--color-text)]">
              {dc.ritualDesc}
            </p>
          </div>

          {/* Qty stepper + CTA */}
          <div className="mt-2 flex items-center gap-4">
            <div className="inline-flex items-center overflow-hidden rounded-full border border-[rgba(30,41,59,0.15)]">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="flex cursor-pointer items-center justify-center border-none bg-transparent px-3.5 py-2.5 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              >
                <Minus size={14} strokeWidth={1.5} />
              </button>
              <span className="min-w-6 px-3.5 text-center font-sans text-sm tabular-nums text-[var(--color-text)]">
                {qty}
              </span>
              <button
                onClick={() => setQty(qty + 1)}
                className="flex cursor-pointer items-center justify-center border-none bg-transparent px-3.5 py-2.5 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>
            <Button
              variant="primary"
              icon={<ArrowRight size={14} strokeWidth={1.5} />}
              onClick={() => {
                onAdd(p, qty);
                onClose();
              }}
              className="flex-1 justify-center"
            >
              {dc.addToCart}
            </Button>
          </div>

        </div>
      </div>
    </>
  );
}
