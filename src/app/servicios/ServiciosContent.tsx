"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { Service } from "@/data/services";
import { ServiceCard } from "@/components/ui/ServiceCard";

const COPY = {
  es: {
    eyebrow:       "Servicios",
    heading:       "Tratamientos pensados con calma.",
    bodyStart:     "Cada modalidad responde a una manera distinta de cargar el cuerpo. Si no estás segura cuál elegir, empieza por una",
    bodyHighlight: "lectura postural",
  },
  en: {
    eyebrow:       "Services",
    heading:       "Treatments designed with care.",
    bodyStart:     "Each modality responds to a different way the body carries tension. If you\u2019re not sure which to choose, start with a",
    bodyHighlight: "postural read",
  },
};

export function ServiciosContent({ services }: { services: Service[] }) {
  const { lang } = useLanguage();
  const c = COPY[lang];

  return (
    <div className="pt-[72px] pb-16 md:pb-24">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">

        {/* ── Header ── */}
        <div className="mb-10 md:mb-16 max-w-[680px]">
          <p className="mb-6 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
            {c.eyebrow}
          </p>
          <h1 className="mb-6 font-serif text-[2.25rem] md:text-5xl font-light leading-[1.05] tracking-[-0.01em] text-[var(--color-text)] lg:text-6xl">
            {c.heading}
          </h1>
          <p className="text-lg leading-[1.65] text-[var(--color-text-muted)]">
            {c.bodyStart}{" "}
            <span className="text-[var(--color-text)]">{c.bodyHighlight}</span>.
          </p>
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <ServiceCard key={svc.id} svc={svc} />
          ))}
        </div>

      </div>
    </div>
  );
}
