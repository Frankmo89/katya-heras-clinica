"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useClinicSettings, type DaySchedule } from "@/context/ClinicSettingsContext";

// ── Schedule formatting helpers ───────────────────────────────────────────────
// Groups consecutive open days that share the same hours into a single range
// label, e.g. [Mon,Tue,Wed,Thu,Fri all 09-18] → "Lun – Vie · 09:00 – 18:00".

type DayGroup = { startDay: number; endDay: number; openTime: string; closeTime: string };

function buildGroups(days: DaySchedule[]): DayGroup[] {
  const open = days.filter((d) => d.is_open && d.open_time && d.close_time);
  if (open.length === 0) return [];

  const groups: DayGroup[] = [];
  let cur: DayGroup = {
    startDay: open[0].day_of_week,
    endDay:   open[0].day_of_week,
    openTime:  open[0].open_time!.slice(0, 5),
    closeTime: open[0].close_time!.slice(0, 5),
  };

  for (let i = 1; i < open.length; i++) {
    const d  = open[i];
    const ot = d.open_time!.slice(0, 5);
    const ct = d.close_time!.slice(0, 5);
    if (d.day_of_week === cur.endDay + 1 && ot === cur.openTime && ct === cur.closeTime) {
      cur.endDay = d.day_of_week;
    } else {
      groups.push(cur);
      cur = { startDay: d.day_of_week, endDay: d.day_of_week, openTime: ot, closeTime: ct };
    }
  }
  groups.push(cur);
  return groups;
}

function formatSchedule(days: DaySchedule[], lang: "es" | "en"): string[] {
  // day_of_week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const names =
    lang === "es"
      ? ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return buildGroups(days).map((g) => {
    const label =
      g.startDay === g.endDay
        ? names[g.startDay]
        : `${names[g.startDay]} – ${names[g.endDay]}`;
    return `${label} · ${g.openTime} – ${g.closeTime}`;
  });
}

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
  const scheduleLines = formatSchedule(weeklySchedule, lang as "es" | "en");

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
          <p className="text-sm leading-7 text-[var(--color-text)]">
            {settings.physical_address}<br />
            <span className="text-[var(--color-text)]/50">
              {t("Cita previa", "By appointment")}
            </span>
          </p>
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
          <p className="text-sm leading-7">
            <Link
              href={`mailto:${settings.contact_email}`}
              className="text-[var(--color-text)] transition-colors hover:text-[var(--color-bronze)]"
            >
              {settings.contact_email}
            </Link>
            <br />
            <Link
              href={`tel:${settings.whatsapp_number.replace(/[\s-]/g, "")}`}
              className="text-[var(--color-text)] transition-colors hover:text-[var(--color-bronze)]"
            >
              {settings.whatsapp_number}
            </Link>
          </p>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="mx-auto mt-16 flex max-w-[1200px] flex-col items-center justify-between gap-4 border-t border-[var(--color-text)]/10 px-8 pt-6 text-xs text-[var(--color-text)]/50 sm:flex-row">
        <span>
          © 2026 Katya Heras Clínica · {t("San Diego ↔ Tecate", "San Diego ↔ Tecate")}
        </span>
        <LanguageToggle />
      </div>

    </footer>
  );
}
