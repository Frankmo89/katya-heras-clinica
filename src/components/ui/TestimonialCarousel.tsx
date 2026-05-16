"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export type Testimonial = { quote: string; author: string };

const FALLBACK: Record<"es" | "en", Testimonial[]> = {
  es: [
    {
      quote: "« Salí de la sesión sintiendo el suelo bajo los pies por primera vez en meses. »",
      author: "Marisol R. · Paciente",
    },
  ],
  en: [
    {
      quote: "« I left the session feeling the floor under my feet for the first time in months. »",
      author: "Marisol R. · Patient",
    },
  ],
};

type Props = {
  testimonialsList?: Testimonial[];
};

export function TestimonialCarousel({ testimonialsList = [] }: Props) {
  const { lang } = useLanguage();
  const list = testimonialsList.length > 0 ? testimonialsList : FALLBACK[lang];

  const [current, setCurrent] = useState(0);
  const [visible, setVisible]   = useState(true);
  const [resetKey, setResetKey] = useState(0);

  // Keep a ref so the interval closure never captures a stale value
  const currentRef = useRef(current);
  currentRef.current = current;

  const goTo = useCallback((idx: number) => {
    setResetKey((k) => k + 1); // reset the auto-advance timer
    setVisible(false);
    setTimeout(() => {
      setCurrent(idx);
      setVisible(true);
    }, 300);
  }, []);

  // Auto-advance every 6 s; resets when user clicks a dot (resetKey changes)
  useEffect(() => {
    if (list.length <= 1) return;
    const timer = setInterval(() => {
      goTo((currentRef.current + 1) % list.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [list.length, goTo, resetKey]);

  // Guard: if list shrinks and current index is now out of bounds
  useEffect(() => {
    if (current >= list.length) setCurrent(0);
  }, [current, list.length]);

  const item = list[current] ?? list[0];
  if (!item) return null;

  return (
    <section className="pb-24 pt-12">
      <div className="mx-auto max-w-[780px] px-8 text-center">

        {/* Quote + author — fades on transition */}
        <div
          className="transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        >
          <p className="font-serif text-[clamp(1.75rem,2.6vw,2.25rem)] font-light italic leading-[1.4] text-[var(--color-text)]">
            {item.quote}
          </p>
          <p className="mt-6 text-[13px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            {item.author}
          </p>
        </div>

        {/* Navigation dots — hidden when only one testimonial */}
        {list.length > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {list.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Ver reseña ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-5 h-2 bg-[var(--color-bronze)]"
                    : "w-2 h-2 bg-[var(--color-bronze)]/30 hover:bg-[var(--color-bronze)]/60"
                }`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
