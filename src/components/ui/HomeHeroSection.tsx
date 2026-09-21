"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  },
  en: {
    eyebrow: "Thai massage · Holistic osteopathy",
    headPre: "Your body",
    lead: "remembers",
    headPost: "I listen.",
    sub: "Thai massage and gentle therapies in a natural space, so your nervous system can return to calm.",
    cta: "Book a session",
    ctaGhost: "Our services",
  },
} as const;

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
  // iOS Low Power Mode (and some other autoplay-blocking contexts) rejects
  // video.play() and leaves the browser showing a native play-button
  // overlay on the poster frame instead of actually looping the video —
  // looks broken. Once play() fails, fall back to the plain poster image
  // for good (no retry loop, no visible button either way).
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const videoSrc = (heroVideoUrl && heroVideoUrl.trim()) || DEFAULT_HERO_REEL;
  const posterSrc = (heroImageUrl && heroImageUrl.trim()) || DEFAULT_POSTER;
  const showVideo = Boolean(videoSrc) && !reduceMotion && !videoFailed;

  useEffect(() => {
    if (!showVideo) return;
    const video = videoRef.current;
    if (!video) return;
    video.play()?.catch(() => setVideoFailed(true));
  }, [showVideo, videoSrc]);

  return (
    /* Breathing room under sticky nav pill (~72px) — Mobbin-style air */
    <section className="relative mx-auto max-w-[1280px] px-4 pb-10 pt-6 md:px-8 md:pb-16 md:pt-10">
      <div className="relative min-h-[72vh] overflow-hidden rounded-[28px] shadow-[0_24px_80px_rgba(0,0,0,0.18)] md:min-h-[78vh] md:rounded-[32px]">
        {/* Full-bleed media */}
        {showVideo ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full scale-[1.06] object-cover"
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
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

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

        {/* Text INSIDE the hero — Mobbin full-bleed pattern */}
        <div className="relative z-10 flex min-h-[72vh] flex-col justify-end px-6 pb-10 pt-24 md:min-h-[78vh] md:px-12 md:pb-14 md:pt-28">
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
