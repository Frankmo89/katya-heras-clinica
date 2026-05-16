"use client";

import { Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { TestimonialCarousel } from "@/components/ui/TestimonialCarousel";
import type { Testimonial } from "@/components/ui/TestimonialCarousel";

const COPY = {
  es: {
    eyebrow:   "Filosofía",
    heading:   "Trabajo con manos, no con prisa.",
    body:      "Cada sesión empieza con una lectura postural y termina con un regreso lento. No mido minutos: noto cómo te vas.",
    list: [
      "Lectura postural inicial · 45 min",
      "Tratamiento manual · sin prisas",
      "Regreso lento al movimiento",
    ],
    quote:     "« Salí de la sesión sintiendo el suelo bajo los pies por primera vez en meses. »",
    quoteAttr: "Marisol R. · Paciente",
  },
  en: {
    eyebrow:   "Philosophy",
    heading:   "Hands, not hurry.",
    body:      "Every session begins with a postural read and ends with a slow return. I don't count minutes — I notice how you leave.",
    list: [
      "Initial postural read · 45 min",
      "Manual treatment · no rushing",
      "Slow return to movement",
    ],
    quote:     "« I left the session feeling the floor under my feet for the first time in months. »",
    quoteAttr: "Marisol R. · Patient",
  },
} as const;

type PhilosophyProps = {
  philosophyImageUrl?: string | null;
  testimonialsList?: Testimonial[];
};

export function HomePhilosophySection({
  philosophyImageUrl,
  testimonialsList = [],
}: PhilosophyProps = {}) {
  const { lang } = useLanguage();
  const c = COPY[lang];

  return (
    <>
      {/* ── Philosophy ─────────────────────────────────────────────── */}
      <section className="py-12 md:py-20">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-5 md:gap-20 md:px-8 md:grid-cols-[1fr_1.2fr]">

          {/* Philosophy image */}
          {philosophyImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={philosophyImageUrl}
              alt="Filosofía"
              className="aspect-[1/1.1] w-full rounded-3xl object-cover"
            />
          ) : (
            <div className="aspect-[1/1.1] rounded-3xl bg-[var(--color-surface-green)]" />
          )}

          {/* Copy */}
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
              {c.eyebrow}
            </p>
            <h2 className="mb-6 font-serif text-[clamp(1.75rem,2.6vw,2.5rem)] font-normal leading-[1.2] text-[var(--color-text)]">
              {c.heading}
            </h2>
            <p className="mb-5 max-w-[520px] text-[17px] leading-[1.65] text-[var(--color-text-muted)]">
              {c.body}
            </p>
            <ul className="flex list-none flex-col gap-3 p-0">
              {c.list.map((item) => (
                <li key={item} className="flex items-center gap-3 text-[15px] text-[var(--color-text)]">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-green)] text-[var(--color-bronze)]">
                    <Check size={14} strokeWidth={1.5} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

      {/* ── Testimonial carousel ───────────────────────────────────── */}
      <TestimonialCarousel testimonialsList={testimonialsList} />
    </>
  );
}
