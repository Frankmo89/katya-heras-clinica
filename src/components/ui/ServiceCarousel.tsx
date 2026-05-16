"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ServiceCard } from "@/components/ui/ServiceCard";
import type { Service } from "@/data/services";

/** Gap between cards in pixels — mirrors Tailwind gap-7 */
const CARD_GAP = 28;

type Props = { services: Service[] };

export function ServiceCarousel({ services }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentRef   = useRef(0);

  const [current,   setCurrent]   = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const [perPage,   setPerPage]   = useState(3);
  const [resetKey,  setResetKey]  = useState(0);

  const maxIndex = Math.max(0, services.length - perPage);

  // Run synchronously before first paint to avoid layout flash.
  // Computes card width and items-per-page from the live container width.
  useLayoutEffect(() => {
    const compute = () => {
      const pp = window.innerWidth >= 1024 ? 3 : 1;
      const W  = containerRef.current?.clientWidth ?? 0;
      setPerPage(pp);
      setCardWidth((W - (pp - 1) * CARD_GAP) / pp);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  // Clamp current when maxIndex shrinks (e.g. on viewport resize)
  useEffect(() => {
    setCurrent((c) => Math.min(c, maxIndex));
  }, [maxIndex]);

  // Keep ref in sync so the interval closure is never stale
  currentRef.current = current;

  const goTo = useCallback(
    (idx: number) => {
      const clamped = Math.min(Math.max(0, idx), maxIndex);
      setCurrent(clamped);
      currentRef.current = clamped;
      setResetKey((k) => k + 1); // restart auto-advance timer
    },
    [maxIndex],
  );

  // Auto-advance every 8 s; timer restarts on manual navigation (resetKey)
  useEffect(() => {
    if (services.length <= perPage) return;
    const id = setInterval(() => {
      const next =
        currentRef.current >= maxIndex ? 0 : currentRef.current + 1;
      setCurrent(next);
      currentRef.current = next;
    }, 8000);
    return () => clearInterval(id);
  }, [services.length, perPage, maxIndex, resetKey]);

  const offset    = current * (cardWidth + CARD_GAP);
  const totalDots = maxIndex + 1;
  const showNav   = totalDots > 1;

  return (
    <div>
      {/* Overflow-clipping wrapper — ref used to measure width */}
      <div ref={containerRef} className="overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
          style={{ gap: CARD_GAP, transform: `translateX(-${offset}px)` }}
        >
          {services.map((s) => (
            <div
              key={s.id}
              // cardWidth > 0 after first paint thanks to useLayoutEffect;
              // w-full is a safe CSS fallback for the server-render frame.
              style={cardWidth > 0 ? { width: cardWidth, flexShrink: 0 } : undefined}
              className="w-full shrink-0"
            >
              <ServiceCard svc={s} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation: prev arrow · dots · next arrow */}
      {showNav && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
            aria-label="Servicios anteriores"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[rgba(30,41,59,0.1)] text-[var(--color-text-muted)] transition-all hover:border-[var(--color-bronze)] hover:text-[var(--color-bronze)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>

          {Array.from({ length: totalDots }, (_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ir al grupo ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-5 h-2 bg-[var(--color-bronze)]"
                  : "w-2 h-2 bg-[var(--color-bronze)]/30 hover:bg-[var(--color-bronze)]/60"
              }`}
            />
          ))}

          <button
            onClick={() => goTo(current + 1)}
            disabled={current === maxIndex}
            aria-label="Siguientes servicios"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[rgba(30,41,59,0.1)] text-[var(--color-text-muted)] transition-all hover:border-[var(--color-bronze)] hover:text-[var(--color-bronze)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
