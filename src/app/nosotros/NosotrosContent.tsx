"use client";

import { Button } from "@/components/ui/Button";
import { ArrowRight, Clock, MapPin, MessageCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useClinicSettings } from "@/context/ClinicSettingsContext";
import { formatScheduleLines } from "@/lib/clinicSchedule";
import {
  buildWhatsAppHref,
  resolveMapsUrl,
  WHATSAPP_PREFILL,
} from "@/lib/clinicSettings";

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
    hoursFallback: "Consulta horario en la clínica",
    cta:           "Reservar una sesión",
    ctaMaps:       "Cómo llegar",
    ctaWa:         "WhatsApp",
    ariaMaps:      "Abrir Google Maps con la dirección de la clínica",
    ariaWa:        "Escribir por WhatsApp para agendar",
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
    hoursFallback: "Check hours with the clinic",
    cta:           "Book a session",
    ctaMaps:       "Get directions",
    ctaWa:         "WhatsApp",
    ariaMaps:      "Open Google Maps with the clinic address",
    ariaWa:        "Message on WhatsApp to book",
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
  const { settings, weeklySchedule, loading } = useClinicSettings();
  const c = COPY[lang];
  const scheduleLines = formatScheduleLines(weeklySchedule, lang);
  const mapsHref = resolveMapsUrl(settings.maps_url, settings.physical_address);
  const waHref = buildWhatsAppHref(
    settings.whatsapp_number,
    WHATSAPP_PREFILL[lang],
  );

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
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[var(--color-bronze)]" strokeWidth={1.5} />
                {loading ? (
                  <span className="inline-block h-4 w-56 animate-pulse rounded bg-slate-200" />
                ) : (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-[var(--color-bronze)]"
                  >
                    {settings.physical_address}
                  </a>
                )}
              </li>
              <li className="flex items-start gap-3">
                <Clock size={16} className="mt-0.5 shrink-0 text-[var(--color-bronze)]" strokeWidth={1.5} />
                {loading ? (
                  <span className="inline-block h-4 w-48 animate-pulse rounded bg-slate-200" />
                ) : scheduleLines.length > 0 ? (
                  <span>
                    {scheduleLines.map((line, i) => (
                      <span key={line}>
                        {line}
                        {i < scheduleLines.length - 1 && <br />}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-[var(--color-text)]/50">{c.hoursFallback}</span>
                )}
              </li>
            </ul>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                href="/reservar"
                icon={<ArrowRight size={14} strokeWidth={1.5} />}
              >
                {c.cta}
              </Button>
              <Button
                variant="secondary"
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={c.ariaMaps}
              >
                {c.ctaMaps}
              </Button>
              <Button
                variant="ghost"
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={c.ariaWa}
                icon={<MessageCircle size={14} strokeWidth={1.5} />}
                className="border border-[var(--color-text)]/10"
              >
                {c.ctaWa}
              </Button>
            </div>
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
