"use client";

import { Button } from "@/components/ui/Button";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const COPY = {
  es: {
    practiceLabel: "La práctica",
    h1:            "Una clínica fundada en la escucha.",
    bio1:          "Katya Heras es osteópata certificada con más de doce años de práctica clínica. Su trabajo combina la precisión de la osteopatía estructural con la sutileza de las terapias craneo-sacrales.",
    bio2:          "Cada sesión está diseñada para que el cuerpo, y el sistema nervioso, recuerden cómo descansar.",
    practiceAlt:   "La práctica",
    spaceLabel:    "El espacio",
    spaceH2:       "Lino, madera y luz natural.",
    gallery1Alt:   "El espacio 1",
    gallery2Alt:   "El espacio 2",
    gallery3Alt:   "El espacio 3",
    locationLabel: "San Diego \u2194 Tecate",
    locationH3:    "Cómo llegar.",
    locationDesc:  "A pocos minutos de la garita de Tecate. Estacionamiento privado y acceso peatonal directo.",
    hours:         "Lun\u2013Vie 09:00\u201318:00 · Sáb 10:00\u201314:00",
    cta:           "Reservar una sesión",
    locationAlt:   "Cómo llegar",
  },
  en: {
    practiceLabel: "The practice",
    h1:            "A clinic founded on listening.",
    bio1:          "Katya Heras is a certified osteopath with over twelve years of clinical practice. Her work combines the precision of structural osteopathy with the subtlety of cranio-sacral therapy.",
    bio2:          "Each session is designed so that the body, and the nervous system, remember how to rest.",
    practiceAlt:   "The practice",
    spaceLabel:    "The space",
    spaceH2:       "Linen, wood, and natural light.",
    gallery1Alt:   "The space 1",
    gallery2Alt:   "The space 2",
    gallery3Alt:   "The space 3",
    locationLabel: "San Diego \u2194 Tecate",
    locationH3:    "How to get here.",
    locationDesc:  "A few minutes from the Tecate border crossing. Private parking and direct pedestrian access.",
    hours:         "Mon\u2013Fri 09:00\u201318:00 · Sat 10:00\u201314:00",
    cta:           "Book a session",
    locationAlt:   "How to get here",
  },
};

interface NosotrosContentProps {
  practiceImageUrl: string | null;
  practiceText:     string | null;
  gallery1Url:      string | null;
  gallery2Url:      string | null;
  gallery3Url:      string | null;
  locationImageUrl: string | null;
}

export function NosotrosContent({
  practiceImageUrl,
  practiceText,
  gallery1Url,
  gallery2Url,
  gallery3Url,
  locationImageUrl,
}: NosotrosContentProps) {
  const { lang } = useLanguage();
  const c = COPY[lang];

  return (
    <div className="pt-[72px] pb-0">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">

        {/* ── Intro: Katya + text ── */}
        <div className="mb-14 md:mb-24 grid grid-cols-1 items-center gap-10 md:gap-16 md:grid-cols-[1fr_1.1fr]">
          {practiceImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={practiceImageUrl}
              alt={c.practiceAlt}
              className="w-full rounded-2xl object-cover"
              style={{ aspectRatio: "4/5" }}
            />
          ) : (
            <div className="w-full rounded-2xl bg-[#F2E8E8]" style={{ aspectRatio: "4/5" }} />
          )}

          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
              {c.practiceLabel}
            </p>
            <h1 className="mb-6 font-serif text-[1.875rem] md:text-4xl font-light leading-[1.1] tracking-tight text-[var(--color-text)] lg:text-6xl">
              {c.h1}
            </h1>
            {practiceText ? (
              <p
                className="text-[17px] leading-[1.65] text-[var(--color-text)]/60"
                style={{ whiteSpace: "pre-line" }}
              >
                {practiceText}
              </p>
            ) : (
              <>
                <p className="mb-4 text-[17px] leading-[1.65] text-[var(--color-text)]/60">
                  {c.bio1}
                </p>
                <p className="text-[17px] leading-[1.65] text-[var(--color-text)]/60">
                  {c.bio2}
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── The space ── */}
        <div className="mb-14 md:mb-24">
          <p className="mb-4 text-center text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
            {c.spaceLabel}
          </p>
          <h2 className="mb-14 text-center font-serif text-3xl font-normal leading-[1.2] text-[var(--color-text)] lg:text-4xl">
            {c.spaceH2}
          </h2>

          {/* Gallery grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_1fr]">
            {gallery1Url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gallery1Url} alt={c.gallery1Alt} className="w-full rounded-2xl object-cover" style={{ aspectRatio: "4/3" }} />
            ) : (
              <div className="w-full rounded-2xl bg-[#E4EDE4]" style={{ aspectRatio: "4/3" }} />
            )}
            {gallery2Url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gallery2Url} alt={c.gallery2Alt} className="w-full rounded-2xl object-cover" style={{ aspectRatio: "4/3" }} />
            ) : (
              <div className="w-full rounded-2xl bg-[#EFE8E1]" style={{ aspectRatio: "4/3" }} />
            )}
            {gallery3Url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gallery3Url} alt={c.gallery3Alt} className="w-full rounded-2xl object-cover" style={{ aspectRatio: "4/3" }} />
            ) : (
              <div className="w-full rounded-2xl bg-[#E8E8E4]" style={{ aspectRatio: "4/3" }} />
            )}
          </div>
        </div>

        {/* ── Cross-border / Location ── */}
        <div className="mb-14 md:mb-24 grid grid-cols-1 items-center gap-8 md:gap-12 rounded-2xl bg-[var(--color-background-soft)] px-6 py-10 md:px-16 md:py-14 md:grid-cols-2">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
              {c.locationLabel}
            </p>
            <h3 className="mb-4 font-serif text-[28px] font-normal leading-[1.2] text-[var(--color-text)]">
              {c.locationH3}
            </h3>
            <p className="mb-6 text-[15px] leading-[1.65] text-[var(--color-text)]/60">
              {c.locationDesc}
            </p>

            <ul className="mb-8 flex flex-col gap-3.5 text-sm text-[var(--color-text)]">
              <li className="flex items-center gap-3">
                <MapPin size={16} className="shrink-0 text-[var(--color-bronze)]" strokeWidth={1.5} />
                Av. Hidalgo 142, Tecate, BC
              </li>
              <li className="flex items-center gap-3">
                <Clock size={16} className="shrink-0 text-[var(--color-bronze)]" strokeWidth={1.5} />
                {c.hours}
              </li>
            </ul>

            <Button
              variant="primary"
              href="/reservar"
              icon={<ArrowRight size={14} strokeWidth={1.5} />}
            >
              {c.cta}
            </Button>
          </div>

          {locationImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={locationImageUrl}
              alt={c.locationAlt}
              className="w-full rounded-2xl object-cover"
              style={{ aspectRatio: "4/3" }}
            />
          ) : (
            <div className="w-full rounded-2xl bg-[#E8E8E4]" style={{ aspectRatio: "4/3" }} />
          )}
        </div>

      </div>
    </div>
  );
}
