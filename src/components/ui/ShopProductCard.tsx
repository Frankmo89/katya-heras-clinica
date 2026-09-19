"use client";

import type { ShopProduct, ProductTone } from "@/data/shop";
import { useClinicSettings } from "@/context/ClinicSettingsContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/format";

// Tone → surface CSS variable (bronze uses a soft tint since no --color-surface-bronze exists)
const toneVar: Record<ProductTone, string> = {
  pink:   "var(--color-surface-pink)",
  green:  "var(--color-surface-green)",
  blue:   "var(--color-surface-blue)",
  bronze: "rgba(192, 138, 94, 0.15)",
};

type CardStyle = "editorial" | "minimal" | "polaroid";

interface ShopProductCardProps {
  p: ShopProduct;
  onOpen: () => void;
  style?: CardStyle;
}

/** Product photo, falling back to a tinted monogram when there's no image. */
function ProductMedia({ p, initial, className }: { p: ShopProduct; initial: string; className: string }) {
  const swatch = toneVar[p.tone];
  if (p.images[0]) {
    return (
      <div className={`${className} overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.images[0]} alt={p.name.es} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`${className} flex items-center justify-center font-serif text-black/[0.08]`}
      style={{ background: `linear-gradient(135deg, ${swatch} 0%, #FAFAF8 100%)` }}
    >
      {initial}
    </div>
  );
}

export function ShopProductCard({ p, onOpen, style = "editorial" }: ShopProductCardProps) {
  const { settings } = useClinicSettings();
  const { currency } = settings;
  const { lang } = useLanguage();
  const initial = p.name[lang].charAt(0);

  if (style === "polaroid") {
    return (
      <button
        onClick={onOpen}
        className="flex cursor-pointer flex-col gap-3.5 rounded-md border border-[rgba(30,41,59,0.08)] bg-[var(--color-background)] p-4 pb-[22px] text-left shadow-[var(--shadow-sm)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
      >
        <ProductMedia p={p} initial={initial} className="aspect-square rounded-[2px] text-5xl" />
        <div className="text-center">
          <p className="mb-1 font-serif text-[18px] text-[var(--color-text)]">{p.name[lang]}</p>
          <p className="font-sans text-[11px] tracking-[0.08em] text-[var(--color-text-muted)]">
            {formatPrice(p.price, currency)}
          </p>
        </div>
      </button>
    );
  }

  if (style === "minimal") {
    return (
      <button
        onClick={onOpen}
        className="flex cursor-pointer flex-col gap-4 border-none bg-transparent p-0 text-left"
      >
        <ProductMedia
          p={p}
          initial={initial}
          className="aspect-[4/5] rounded-2xl text-6xl transition-all duration-500 hover:opacity-90"
        />
        <div className="flex items-baseline justify-between gap-3 px-1">
          <span className="font-serif text-[19px] font-normal text-[var(--color-text)]">{p.name[lang]}</span>
          <span className="shrink-0 tabular-nums text-[13px] text-[var(--color-text-muted)]">
            {formatPrice(p.price, currency)}
          </span>
        </div>
      </button>
    );
  }

  // editorial (default)
  return (
    <button
      onClick={onOpen}
      className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[rgba(30,41,59,0.06)] bg-[var(--color-background)] p-0 text-left shadow-[var(--shadow-sm)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
    >
      <ProductMedia p={p} initial={initial} className="aspect-square text-[72px]" />

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2.5 p-[22px]">
        <h3 className="m-0 font-serif text-[21px] font-normal leading-[1.2] text-[var(--color-text)]">
          {p.name[lang]}
        </h3>
        <p className="m-0 flex-1 text-[13px] leading-[1.55] text-[var(--color-text-muted)]">
          {p.story[lang]}
        </p>
        <div className="mt-1.5 flex items-center justify-between border-t border-[rgba(30,41,59,0.06)] pt-3.5">
          <span className="font-serif text-xl text-[var(--color-text)]">
            {formatPrice(p.price, currency)}
          </span>
          {p.size && (
            <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              {p.size}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
