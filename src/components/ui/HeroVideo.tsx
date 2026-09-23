"use client";

import { useEffect, useRef, useState } from "react";

export type HeroVideoSource = {
  src: string;
  /** CSS media query — e.g. "(max-width: 767px)" so phones skip desktop files */
  media?: string;
  type?: string;
};

export type HeroVideoProps = {
  sources: HeroVideoSource[];
  poster: string;
  className?: string;
};

/**
 * Content-agnostic full-bleed hero video.
 * Parent supplies sources + poster; this component owns autoplay robustness:
 * - muted via ref + defaultMuted (React `muted` alone is unreliable on iOS)
 * - programmatic play() with catch → static poster fallback (no native play button)
 * - prefers-reduced-motion → poster only
 */
export function HeroVideo({ sources, poster, className }: HeroVideoProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  // iOS Low Power Mode / data saver reject play() and leave a native play-button
  // overlay on the poster — looks broken. Fall back to a plain <img> instead.
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const showVideo = sources.length > 0 && !reduceMotion && !videoFailed;
  // Stable key so changing source list remounts and re-attempts play
  const sourcesKey = sources.map((s) => `${s.media ?? ""}:${s.src}`).join("|");

  useEffect(() => {
    if (!showVideo) return;
    const video = videoRef.current;
    if (!video) return;

    // React's `muted` prop alone is unreliable on iOS Safari for autoplay policy —
    // set muted / defaultMuted on the DOM node (and the HTML attribute) before play().
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.playsInline = true;

    const attempt = video.play();
    if (attempt !== undefined) {
      attempt.catch(() => setVideoFailed(true));
    }
  }, [showVideo, sourcesKey]);

  if (!showVideo) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={poster}
        alt=""
        className={className}
        aria-hidden
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={poster}
      aria-hidden
      controls={false}
      disablePictureInPicture
      // Decorative background — no keyboard focus
      tabIndex={-1}
    >
      {sources.map((s) => (
        <source
          key={`${s.media ?? "default"}-${s.src}`}
          src={s.src}
          type={s.type ?? "video/mp4"}
          {...(s.media ? { media: s.media } : {})}
        />
      ))}
    </video>
  );
}
