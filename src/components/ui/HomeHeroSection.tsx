"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";

const COPY = {
  es: {
    eyebrow:  "Osteopatía · Bienestar holístico",
    headPre:  "Tu cuerpo",
    lead:     "recuerda",
    headPost: "Yo te escucho.",
    sub: "Osteopatía manual y terapias suaves en un espacio diseñado para que el sistema nervioso, por fin, se afloje.",
    cta:      "Reservar una sesión",
    ctaGhost: "Ver servicios",
    livePill: "En vivo",
  },
  en: {
    eyebrow:  "Osteopathy · Holistic wellness",
    headPre:  "Your body",
    lead:     "remembers",
    headPost: "I listen.",
    sub: "Manual osteopathy and gentle therapies in a space designed for your nervous system to finally let go.",
    cta:      "Book a session",
    ctaGhost: "Our services",
    livePill: "Live",
  },
} as const;

type HeroProps = {
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroImageUrl?: string | null;
};

export function HomeHeroSection({ heroTitle, heroSubtitle, heroImageUrl }: HeroProps = {}) {
  const { lang } = useLanguage();
  const c = COPY[lang];

  return (
    <section className="pb-12 pt-8 md:pb-24 md:pt-[72px]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-8 px-5 md:gap-16 md:px-8 md:grid-cols-[1.1fr_1fr]">

        {/* Left — copy */}
        <div>
          <p className="mb-6 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
            {c.eyebrow}
          </p>
          <h1 className="mb-5 md:mb-7 font-serif text-[clamp(3rem,5.5vw,5rem)] font-light leading-[1.05] tracking-[-0.01em] text-[var(--color-text)]">
            {heroTitle ? (
              heroTitle
            ) : (
              <>
                {c.headPre}<br />
                <em className="not-italic font-normal text-[var(--color-bronze)]">{c.lead}</em>.<br />
                {c.headPost}
              </>
            )}
          </h1>
          <p className="mb-7 md:mb-9 max-w-[480px] text-[18px] leading-[1.65] text-[var(--color-text-muted)]">
            {heroSubtitle || c.sub}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="primary"
              href="/reservar"
              icon={<ArrowRight size={14} strokeWidth={1.5} />}
            >
              {c.cta}
            </Button>
            <Button variant="ghost" href="/servicios">
              {c.ctaGhost}
            </Button>
          </div>
        </div>

        {/* Right — hero media */}
        <div className="relative aspect-[3/2] md:aspect-[4/5] overflow-hidden rounded-3xl shadow-[var(--shadow-md)]">
          {heroImageUrl ? (
            /* Custom image uploaded via admin */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImageUrl}
              alt="Hero"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            /* Default: KoolShooters · Pexels 6628242 */
            <video
              autoPlay
              loop
              muted
              playsInline
              poster="https://images.pexels.com/videos/6628242/free-video-6628242.jpg?auto=compress&cs=tinysrgb&w=1200"
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source
                src="https://videos.pexels.com/video-files/6628242/6628242-hd_1920_1080_25fps.mp4"
                type="video/mp4"
              />
            </video>
          )}

          {/* Glassmorphism overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 50%, rgba(192,138,94,0.10) 100%)",
              backdropFilter: "saturate(0.92) brightness(1.02)",
              WebkitBackdropFilter: "saturate(0.92) brightness(1.02)",
            }}
          />

          {/* Bronze hairline frame */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_0_0_1px_rgba(192,138,94,0.18)]" />

          {/* Live pill — only shown for the default video */}
          {!heroImageUrl && (
            <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-white/[0.78] px-3 py-[7px] pl-[10px] text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-text)] [backdrop-filter:blur(10px)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-bronze)]" />
              {c.livePill}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
