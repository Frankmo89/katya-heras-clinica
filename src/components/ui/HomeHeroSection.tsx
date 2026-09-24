"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HeroVideo, type HeroVideoSource } from "@/components/ui/HeroVideo";
import { useLanguage } from "@/context/LanguageContext";

const COPY = {
  es: {
    locationChip: "Osteopatía en Tecate, B.C. · cerca de San Diego",
    eyebrow: "Masaje tailandés · Osteopatía holística",
    headPre: "Tu cuerpo",
    lead: "recuerda",
    headPost: "Yo te escucho.",
    sub: "Masaje tailandés y terapias suaves en un espacio natural, para que el sistema nervioso vuelva a su calma.",
    cta: "Reservar una sesión",
    ctaGhost: "Ver servicios",
  },
  en: {
    locationChip: "Osteopathy in Tecate, B.C. · near San Diego",
    eyebrow: "Thai massage · Holistic osteopathy",
    headPre: "Your body",
    lead: "remembers",
    headPost: "I listen.",
    sub: "Thai massage and gentle therapies in a natural space, so your nervous system can return to calm.",
    cta: "Book a session",
    ctaGhost: "Our services",
  },
} as const;

/** Fase 2 assets under public/hero/ (clip 01): mobile native vertical + desktop style-B blur.
 *  See public/hero/README.md for trim/encode notes and size targets. */
const HERO_POSTER = "/hero/hero-poster.webp";
const HERO_SOURCES: HeroVideoSource[] = [
  {
    src: "/hero/hero-mobile.mp4",
    media: "(max-width: 767px)",
    type: "video/mp4",
  },
  {
    src: "/hero/hero-desktop.mp4",
    media: "(min-width: 768px)",
    type: "video/mp4",
  },
  // Fallback for browsers that ignore source media queries
  { src: "/hero/hero-desktop.mp4", type: "video/mp4" },
];

type HeroProps = {
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroImageUrl?: string | null;
  heroVideoUrl?: string | null;
};

export function HomeHeroSection({
  heroTitle,
  heroSubtitle,
  heroImageUrl,
  heroVideoUrl,
}: HeroProps = {}) {
  const { lang } = useLanguage();
  const c = COPY[lang];

  const posterSrc = (heroImageUrl && heroImageUrl.trim()) || HERO_POSTER;
  // Optional single override (env / CMS) — otherwise multi-resolution hero assets
  const override = heroVideoUrl?.trim();
  const sources: HeroVideoSource[] = override
    ? [{ src: override, type: "video/mp4" }]
    : HERO_SOURCES;

  return (
    /* Breathing room under sticky nav pill (~72px) — Mobbin-style air */
    <section className="relative mx-auto max-w-[1280px] px-4 pb-10 pt-6 md:px-8 md:pb-16 md:pt-10">
      <div className="relative min-h-[72vh] overflow-hidden rounded-[28px] shadow-[0_24px_80px_rgba(0,0,0,0.18)] md:min-h-[78vh] md:rounded-[32px]">
        {/* Full-bleed media — HeroVideo owns mute/play/fallback/reduced-motion */}
        <HeroVideo
          sources={sources}
          poster={posterSrc}
          className="absolute inset-0 h-full w-full scale-[1.06] object-cover"
        />

        {/* Cinematic scrim for readable text on video */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,32,24,0.35) 0%, rgba(20,32,24,0.15) 40%, rgba(20,32,24,0.72) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(74,110,82,0.35), transparent 70%)",
          }}
        />

        {/* Text INSIDE the hero — Mobbin full-bleed pattern (unchanged Phase 1) */}
        <div className="relative z-10 flex min-h-[72vh] flex-col justify-end px-6 pb-10 pt-24 md:min-h-[78vh] md:px-12 md:pb-14 md:pt-28">
          <p className="mb-3 inline-flex max-w-full items-center rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[11px] font-medium tracking-[0.04em] text-white/95 backdrop-blur-md md:mb-4 md:text-xs">
            {c.locationChip}
          </p>
          <p className="mb-4 text-[11px] uppercase tracking-[0.28em] text-white/80 md:mb-5 md:text-xs">
            {c.eyebrow}
          </p>
          <h1 className="max-w-[16ch] font-serif text-[clamp(2.6rem,7vw,4.75rem)] font-light leading-[1.05] tracking-[-0.02em] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]">
            {heroTitle ? (
              heroTitle
            ) : (
              <>
                {c.headPre}{" "}
                <em className="not-italic font-normal text-[color:var(--color-bronze,#c08a5e)]">
                  {c.lead}
                </em>
                . {c.headPost}
              </>
            )}
          </h1>
          <p className="mt-4 max-w-[36rem] text-[15px] leading-[1.65] text-white/85 md:mt-5 md:text-[17px]">
            {heroSubtitle || c.sub}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3 md:mt-9 md:gap-4">
            <Button
              variant="primary"
              href="/reservar"
              icon={<ArrowRight size={14} strokeWidth={1.5} />}
              className="shadow-lg shadow-black/25"
            >
              {c.cta}
            </Button>
            <Button
              variant="ghost"
              href="/servicios"
              className="border border-white/35 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
            >
              {c.ctaGhost}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
