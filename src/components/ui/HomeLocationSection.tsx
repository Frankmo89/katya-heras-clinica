"use client";

import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";

const COPY = {
  es: {
    headline: "Atiendo pacientes de San Diego.",
    sub:      "Garita de Tecate · estacionamiento privado.",
    cta:      "Cómo llegar",
  },
  en: {
    headline: "I see patients from San Diego.",
    sub:      "Tecate border crossing · private parking.",
    cta:      "How to get here",
  },
} as const;

export function HomeLocationSection() {
  const { lang } = useLanguage();
  const c = COPY[lang];

  return (
    <section className="pb-12 md:pb-24">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-8 rounded-2xl bg-[var(--color-surface-blue)] px-6 py-8 md:px-12 md:py-10">
          <div className="flex items-center gap-5">
            <MapPin
              size={28}
              strokeWidth={1.5}
              className="shrink-0 text-[var(--color-bronze)]"
            />
            <div>
              <p className="mb-1 font-serif text-[22px] text-[var(--color-text)]">
                {c.headline}
              </p>
              <p className="text-[14px] text-[var(--color-text-muted)]">
                {c.sub}
              </p>
            </div>
          </div>
          <Button variant="secondary" href="/nosotros">
            {c.cta}
          </Button>
        </div>
      </div>
    </section>
  );
}
