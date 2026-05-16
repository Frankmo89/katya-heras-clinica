"use client";

import { ArrowRight } from "lucide-react";
import { ServiceCarousel } from "@/components/ui/ServiceCarousel";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import type { Service } from "@/data/services";

const COPY = {
  es: {
    eyebrow: "Servicios",
    heading: "Una hora para soltar.",
    cta:     "Todos los servicios",
  },
  en: {
    eyebrow: "Services",
    heading: "An hour to let go.",
    cta:     "All services",
  },
} as const;

export function HomeServicesSection({ services }: { services: Service[] }) {
  const { lang } = useLanguage();
  const c = COPY[lang];

  return (
    <section className="bg-[var(--color-background-soft)] py-12 md:py-20">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="mb-8 md:mb-12 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-[520px]">
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
              {c.eyebrow}
            </p>
            <h2 className="m-0 font-serif text-[clamp(2rem,3vw,2.75rem)] font-normal leading-[1.15] text-[var(--color-text)]">
              {c.heading}
            </h2>
          </div>
          <Button
            variant="ghost"
            href="/servicios"
            icon={<ArrowRight size={14} strokeWidth={1.5} />}
          >
            {c.cta}
          </Button>
        </div>

        <ServiceCarousel services={services} />
      </div>
    </section>
  );
}
