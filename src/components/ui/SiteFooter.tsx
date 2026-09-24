"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useClinicSettings } from "@/context/ClinicSettingsContext";
import { formatScheduleLines } from "@/lib/clinicSchedule";
import {
  buildWhatsAppHref,
  instagramProfileUrl,
  resolveMapsUrl,
  WHATSAPP_PREFILL,
  whatsappDigits,
} from "@/lib/clinicSettings";

function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="inline-flex rounded-full border border-[var(--color-text)]/10 bg-white p-[3px] text-xs">
      {(["es", "en"] as const).map((L) => (
        <button
          key={L}
          onClick={() => setLang(L)}
          className={`cursor-pointer rounded-full px-3 py-1.5 font-sans font-medium transition-all duration-300 ${
            lang === L
              ? "bg-[var(--color-bronze)] text-white"
              : "bg-transparent text-[var(--color-text)]/50 hover:text-[var(--color-text)]"
          }`}
        >
          {L.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function SiteFooter() {
  const { t, lang } = useLanguage();
  const { settings, weeklySchedule, loading } = useClinicSettings();
  const scheduleLines = formatScheduleLines(weeklySchedule, lang as "es" | "en");
  const mapsHref = resolveMapsUrl(settings.maps_url, settings.physical_address);
  const waHref = buildWhatsAppHref(
    settings.whatsapp_number,
    WHATSAPP_PREFILL[lang as "es" | "en"],
  );
  const igHref = settings.instagram_url ? instagramProfileUrl(settings.instagram_url) : null;
  const telHref = `tel:+${whatsappDigits(settings.whatsapp_number)}`;

  return (
    <footer className="mt-24 bg-[var(--color-background-soft)] pb-12 pt-20">

      {/* Main grid */}
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-8 px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">

        {/* Brand */}
        <div>
          <div className="mb-[18px] flex items-center gap-3.5">
            <Image
              src="/logo.png"
              alt="Katya Heras"
              width={160}
              height={72}
              className="h-[72px] w-auto object-contain"
            />
          </div>
          <p className="max-w-[280px] text-sm leading-relaxed text-[var(--color-text)]/60">
            {t(
              "Osteopatía y bienestar holístico. Una sesión a la vez.",
              "Osteopathy and holistic wellness. One session at a time.",
            )}
          </p>
        </div>

        {/* Visit */}
        <div>
          <p className="mb-3.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
            {t("Visítanos", "Visit")}
          </p>
          {loading ? (
            // Avoids ever flashing the hardcoded fallback address from
            // CLINIC_SETTINGS_DEFAULTS while the real value is still
            // in-flight — the same reason "Horario" already skeletons.
            <div className="space-y-2 pt-0.5">
              <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
            </div>
          ) : (
            <p className="text-sm leading-7 text-[var(--color-text)]">
              <Link
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[var(--color-bronze)]"
              >
                {settings.physical_address}
              </Link>
              <br />
              <span className="text-[var(--color-text)]/50">
                {t("Cita previa", "By appointment")}
              </span>
            </p>
          )}
        </div>

        {/* Hours */}
        <div>
          <p className="mb-3.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
            {t("Horario", "Hours")}
          </p>
          {loading ? (
            // Subtle skeleton while schedule fetches
            <div className="space-y-2 pt-0.5">
              <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
            </div>
          ) : scheduleLines.length > 0 ? (
            <p className="text-sm leading-7 text-[var(--color-text)]">
              {scheduleLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < scheduleLines.length - 1 && <br />}
                </span>
              ))}
            </p>
          ) : (
            <p className="text-sm text-[var(--color-text)]/50">
              {t("No disponible", "Not available")}
            </p>
          )}
        </div>

        {/* Contact */}
        <div>
          <p className="mb-3.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
            {t("Contacto", "Contact")}
          </p>
          {loading ? (
            <div className="space-y-2 pt-0.5">
              <div className="h-3 w-36 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
            </div>
          ) : (
            <p className="text-sm leading-7">
              <Link
                href={`mailto:${settings.contact_email}`}
                className="text-[var(--color-text)] transition-colors hover:text-[var(--color-bronze)]"
              >
                {settings.contact_email}
              </Link>
              <br />
              <Link
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-text)] transition-colors hover:text-[var(--color-bronze)]"
                aria-label={t("WhatsApp", "WhatsApp")}
              >
                WhatsApp · {settings.whatsapp_number}
              </Link>
              <br />
              <Link
                href={telHref}
                className="text-[var(--color-text)]/70 transition-colors hover:text-[var(--color-bronze)]"
                aria-label={t("Llamar", "Call")}
              >
                {t("Llamar", "Call")}
              </Link>
              {igHref && (
                <>
                  <br />
                  <Link
                    href={igHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-text)] transition-colors hover:text-[var(--color-bronze)]"
                  >
                    Instagram
                  </Link>
                </>
              )}
            </p>
          )}
        </div>

      </div>

      {/* Bottom bar */}
      <div className="mx-auto mt-16 flex max-w-[1200px] flex-col items-center justify-between gap-4 border-t border-[var(--color-text)]/10 px-8 pt-6 text-xs text-[var(--color-text)]/50 sm:flex-row">
        <span>
          © 2026 Katya Heras Clínica · {t("Tecate, B.C. · cerca de la frontera", "Tecate, B.C. · near the border")}
        </span>
        <LanguageToggle />
      </div>

    </footer>
  );
}
