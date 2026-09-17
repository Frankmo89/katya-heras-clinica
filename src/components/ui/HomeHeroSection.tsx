"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";

const COPY = {
  es: {
    eyebrow: "Masaje tailandés · Osteopatía holística",
    headPre: "Tu cuerpo",
    lead: "recuerda",
    headPost: "Yo te escucho.",
    sub: "Masaje tailandés y terapias suaves en un espacio natural, para que el sistema nervioso vuelva a su calma.",
    cta: "Reservar una sesión",
    ctaGhost: "Ver servicios",
    livePill: "En vivo",
  },
  en: {
    eyebrow: "Thai massage · Holistic osteopathy",
    headPre: "Your body",
    lead: "remembers",
    headPost: "I listen.",
    sub: "Thai massage and gentle therapies in a natural space, so your nervous system can return to calm.",
    cta: "Book a session",
    ctaGhost: "Our services",
    livePill: "Live",
  },
} as const;

/** Single edited reel: close-ups only (hands/back/feet), no faces, no latex. */
const DEFAULT_HERO_REEL = "/hero-reel.mp4";
const DEFAULT_POSTER =
  "https://hlotbgirhjbnppdtllkv.supabase.co/storage/v1/object/public/public_assets/hero/hero-image.jpg";

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
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const videoSrc = (heroVideoUrl && heroVideoUrl.trim()) || DEFAULT_HERO_REEL;
  const posterSrc = (heroImageUrl && heroImageUrl.trim()) || DEFAULT_POSTER;
  const showVideo = Boolean(videoSrc) && !reduceMotion;

  return (
    <section className="pb-10 pt-4 md:pb-24 md:pt-[72px]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-6 md:gap-16 md:px-8 md:grid-cols-[1.1fr_1fr]">
        <div className="order-2 px-5 md:order-1 md:px-0">
          <p className="mb-5 text-xs uppercase tracking-[0.22em] text-[var(--color-surface-green,#5a7a62)] md:mb-6 md:text-[var(--color-bronze)]">
            {c.eyebrow}
          </p>
          <h1 className="mb-4 font-serif text-[clamp(2.4rem,6vw,5rem)] font-light leading-[1.05] tracking-[-0.01em] text-[var(--color-text)] md:mb-7">
            {heroTitle ? (
              heroTitle
            ) : (
              <>
                {c.headPre}
                <br />
                <em className="not-italic font-normal text-[var(--color-bronze)]">
                  {c.lead}
                </em>
                .<br />
                {c.headPost}
              </>
            )}
          </h1>
          <p className="mb-7 max-w-[480px] text-[16px] leading-[1.65] text-[var(--color-text-muted)] md:mb-9 md:text-[18px]">
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

        <div className="relative order-1 aspect-[4/5] max-h-[62vh] overflow-hidden rounded-b-3xl shadow-[var(--shadow-md)] md:order-2 md:max-h-none md:aspect-[4/5] md:rounded-3xl">
          {showVideo ? (
            <video
              className="absolute inset-0 h-full w-full scale-[1.08] object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={posterSrc}
              aria-hidden
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterSrc}
              alt="Hero"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(145deg, rgba(232,240,228,0.22) 0%, rgba(255,255,255,0.04) 45%, rgba(74,110,82,0.18) 100%)",
              backdropFilter: "saturate(1.05) brightness(1.02)",
              WebkitBackdropFilter: "saturate(1.05) brightness(1.02)",
            }}
          />

          <div className="pointer-events-none absolute inset-0 rounded-b-3xl shadow-[inset_0_0_0_1px_rgba(90,122,98,0.22)] md:rounded-3xl" />

          {showVideo && (
            <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-white/[0.78] px-3 py-[7px] pl-[10px] text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-text)] [backdrop-filter:blur(10px)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-surface-green,#5a7a62)]" />
              {c.livePill}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
