"use client";

import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { useClinicSettings } from "@/context/ClinicSettingsContext";
import {
  buildWhatsAppHref,
  resolveMapsUrl,
  WHATSAPP_PREFILL,
} from "@/lib/clinicSettings";

const COPY = {
  es: {
    headline: "Atiendo pacientes de San Diego.",
    sub: "Garita de Tecate · estacionamiento privado.",
    ctaMaps: "Cómo llegar",
    ctaWa: "WhatsApp",
    ariaMaps: "Abrir Google Maps con la dirección de la clínica",
    ariaWa: "Escribir por WhatsApp para agendar",
  },
  en: {
    headline: "I see patients from San Diego.",
    sub: "Tecate border crossing · private parking.",
    ctaMaps: "Get directions",
    ctaWa: "WhatsApp",
    ariaMaps: "Open Google Maps with the clinic address",
    ariaWa: "Message on WhatsApp to book",
  },
} as const;

export function HomeLocationSection() {
  const { lang } = useLanguage();
  const { settings } = useClinicSettings();
  const c = COPY[lang];
  const mapsHref = resolveMapsUrl(settings.maps_url, settings.physical_address);
  const waHref = buildWhatsAppHref(
    settings.whatsapp_number,
    WHATSAPP_PREFILL[lang],
  );

  return (
    <section className="pb-12 md:pb-24">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-8 rounded-2xl bg-[var(--color-surface-blue)] px-6 py-8 md:px-12 md:py-10">
          <div className="flex items-center gap-5">
            <MapPin
              size={28}
              strokeWidth={1.5}
              className="shrink-0 text-[var(--color-bronze)]"
            />
            <div>
              <p className="mb-1 font-serif text-[22px] text-[var(--color-text)]">
                {c.headline}
              </p>
              <p className="text-[14px] text-[var(--color-text-muted)]">
                {c.sub}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
              className="border border-[var(--color-text)]/10"
            >
              {c.ctaWa}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
