"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { Service, ServiceTone } from "@/data/services";
import { useLanguage } from "@/context/LanguageContext";
import { useClinicSettings } from "@/context/ClinicSettingsContext";
import { formatPrice } from "@/lib/format";

const surfaceBadge: Record<ServiceTone, string> = {
  green: "bg-[var(--color-surface-green)] text-[var(--color-text)]",
  pink:  "bg-[var(--color-surface-pink)]  text-[var(--color-text)]",
  blue:  "bg-[var(--color-surface-blue)]  text-[var(--color-text)]",
};

export function ServiceCard({ svc }: { svc: Service }) {
  const { lang } = useLanguage();
  const { settings } = useClinicSettings();
  const copy = lang === "es" ? svc.es : svc.en;
  // Badge label: last word of the localised service name
  const badgeLabel = copy.name.split(" ").at(-1) ?? copy.name;

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl bg-[var(--color-background)] p-8 shadow-[var(--shadow-sm)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">

      {/* Tone badge */}
      <span
        className={`self-start rounded-full px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] ${surfaceBadge[svc.tone]}`}
      >
        {badgeLabel}
      </span>

      {/* Name */}
      <h3 className="font-serif text-2xl font-normal leading-[1.2] text-[var(--color-text)]">
        {copy.name}
      </h3>

      {/* Tagline */}
      <p className="font-serif text-base italic leading-[1.4] text-[var(--color-bronze)]">
        {copy.tagline}
      </p>

      {/* Description */}
      <p className="flex-1 text-sm leading-[1.6] text-[var(--color-text-muted)]">
        {copy.desc}
      </p>

      {/* Meta row: duration + price */}
      <div className="flex items-center justify-between border-t border-[rgba(30,41,59,0.08)] pt-4">
        <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-muted)]">
          <Clock size={14} strokeWidth={1.5} />
          {svc.duration}&nbsp;min
        </span>
        <span className="font-serif text-[22px] text-[var(--color-text)]">
          {formatPrice(Number(svc.price.replace(/,/g, '')), settings.currency)}
        </span>
      </div>

      {/* Ghost CTA — renders as <Link> (no nested button-in-anchor) */}
      <Link
        href={`/servicios/${svc.id}`}
        className="inline-flex items-center gap-2 py-2 font-sans text-sm uppercase tracking-widest text-[var(--color-text)] transition-colors duration-300 hover:text-[var(--color-bronze)]"
      >
        {lang === "es" ? "Reservar" : "Book"} <ArrowRight size={14} strokeWidth={1.5} />
      </Link>

    </div>
  );
}
