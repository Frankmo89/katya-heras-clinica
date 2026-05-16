"use client";

import Link from "next/link";
import { ArrowLeft, Check, Clock } from "lucide-react";
import type { Service, ServiceDetailData, ServiceTone } from "@/data/services";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/ui/ServiceCard";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { ServicePriceDisplay } from "@/components/ui/ServicePriceDisplay";

const toneVar: Record<ServiceTone, string> = {
  green: "var(--color-surface-green)",
  pink:  "var(--color-surface-pink)",
  blue:  "var(--color-surface-blue)",
};

const toneBgClass: Record<ServiceTone, string> = {
  green: "bg-[var(--color-surface-green)]",
  pink:  "bg-[var(--color-surface-pink)]",
  blue:  "bg-[var(--color-surface-blue)]",
};

const COPY = {
  es: {
    breadcrumb:      "Servicios",
    duration:        "Duración",
    investment:      "Inversión",
    bookCta:         "Reservar esta sesión",
    availCta:        "Ver disponibilidad",
    timelineLabel:   "La sesión",
    timelineHeading: "Qué esperar, minuto a minuto.",
    timelineDesc:    "No me gusta que llegues sin saber lo que va a pasar. Esto es un mapa, no un guion.",
    forWhomLabel:    "Buena opción si",
    forWhomHeading:  "Esta sesión es para ti si\u2026",
    notForLabel:     "Honestidad clínica",
    notForHeading:   "Cuándo no es la indicada.",
    notForFootnote:  "Si dudas, reserva una Lectura postural primero. Es más corta y barata, y salimos con un plan claro.",
    spaceLabel:      "El espacio",
    spaceHeading:    "Diseñado para soltar.",
    spaceCaption:    "Camilla térmica · luz cálida regulable · sonido aislado · té de bienvenida.",
    faqLabel:        "Preguntas honestas",
    faqHeading:      "Lo que la gente pregunta antes.",
    ctaHead1:        "¿Lista para",
    ctaAccent:       "una hora",
    ctaHead2:        "sin prisa?",
    ctaBook:         "Reservar esta sesión",
    ctaNote:         "Confirmación inmediata · Política de cancelación 24h",
    relatedLabel:    "Quizá también",
    relatedHeading:  "Otras sesiones que combinan bien.",
  },
  en: {
    breadcrumb:      "Services",
    duration:        "Duration",
    investment:      "Investment",
    bookCta:         "Book this session",
    availCta:        "See availability",
    timelineLabel:   "The session",
    timelineHeading: "What to expect, minute by minute.",
    timelineDesc:    "I don\u2019t like you arriving without knowing what\u2019s going to happen. This is a map, not a script.",
    forWhomLabel:    "A good fit if",
    forWhomHeading:  "This session is right for you if\u2026",
    notForLabel:     "Clinical honesty",
    notForHeading:   "When it\u2019s not the right fit.",
    notForFootnote:  "If you\u2019re not sure, book a Postural Read first. It\u2019s shorter, costs less, and we leave with a clear plan.",
    spaceLabel:      "The space",
    spaceHeading:    "Designed to let go.",
    spaceCaption:    "Thermal table · warm adjustable light · sound isolation · welcome tea.",
    faqLabel:        "Honest questions",
    faqHeading:      "What people ask before.",
    ctaHead1:        "Ready for",
    ctaAccent:       "one hour",
    ctaHead2:        "without rush?",
    ctaBook:         "Book this session",
    ctaNote:         "Instant confirmation · 24h cancellation policy",
    relatedLabel:    "You might also like",
    relatedHeading:  "Other sessions that go well together.",
  },
};

interface Props {
  svc:             Service;
  detail:          ServiceDetailData;
  relatedServices: Service[];
  serviceIndex:    number;
}

export function ServiceDetailContent({ svc, detail, relatedServices, serviceIndex }: Props) {
  const { lang } = useLanguage();
  const c    = COPY[lang];
  const hero = detail.hero[lang];
  const price = Number(svc.price.replace(/,/g, ""));

  return (
    <div>

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1200px] px-8 pb-2 pt-6">
        <Link
          href="/servicios"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-bronze)]"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          {c.breadcrumb}
        </Link>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="pb-20 pt-10">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 px-8 md:grid-cols-[1.15fr_1fr]">

          {/* Left — copy */}
          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
              {hero.eyebrow}
            </p>
            <p className="mb-[18px] text-[11px] uppercase tracking-[0.16em] text-[var(--color-bronze)]">
              {hero.kicker}
            </p>
            <h1 className="mb-7 font-serif text-5xl font-light leading-[1.05] tracking-[-0.01em] text-[var(--color-text)] lg:text-[clamp(2.5rem,4.6vw,4.5rem)]">
              {hero.head}
            </h1>
            <p className="mb-9 max-w-[520px] text-lg leading-[1.65] text-[var(--color-text-muted)]">
              {hero.lede}
            </p>

            {/* Duration + price meta */}
            <div className="mb-9 flex flex-wrap items-center gap-8">
              <div>
                <p className="mb-1.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">{c.duration}</p>
                <p className="font-serif text-2xl text-[var(--color-text)]">
                  {svc.duration}&nbsp;<span className="text-[13px] text-[var(--color-text-muted)]">min</span>
                </p>
              </div>
              <div className="hidden h-8 w-px self-stretch bg-[rgba(30,41,59,0.08)] md:block" />
              <div>
                <p className="mb-1.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">{c.investment}</p>
                <p className="font-serif text-2xl text-[var(--color-text)]">
                  <ServicePriceDisplay price={price} />
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                href="/reservar"
                icon={<Clock size={14} strokeWidth={1.5} />}
              >
                {c.bookCta}
              </Button>
              <Button variant="ghost" href="/reservar">
                {c.availCta}
              </Button>
            </div>
          </div>

          {/* Right — editorial visual block */}
          <div
            className="relative overflow-hidden rounded-2xl shadow-[var(--shadow-md)]"
            style={{
              aspectRatio: "4/5",
              background: `linear-gradient(135deg, ${toneVar[svc.tone]} 0%, var(--color-background-soft) 100%)`,
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 70% 40%, rgba(192,138,94,0.18), transparent 55%)",
              }}
            />
            <div className="absolute left-8 right-8 top-8 flex justify-between font-sans text-[11px] uppercase tracking-[0.16em] text-black/40">
              <span>№ {String(serviceIndex).padStart(2, "0")}</span>
              <span>{svc.duration} min</span>
            </div>
            <div className="absolute bottom-9 left-9 right-9 font-serif text-[120px] font-light leading-none tracking-[-0.04em] text-black/[0.08]">
              {hero.kicker.split(" ")[0]}.
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-[rgba(192,138,94,0.18)]" />
          </div>

        </div>
      </section>

      {/* ── Timeline ───────────────────────────────────────────────────── */}
      <section className="bg-[var(--color-background-soft)] py-20">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="mb-12 max-w-[560px]">
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
              {c.timelineLabel}
            </p>
            <h2 className="mb-4 font-serif text-4xl font-normal leading-[1.15] text-[var(--color-text)]">
              {c.timelineHeading}
            </h2>
            <p className="text-base leading-[1.65] text-[var(--color-text-muted)]">
              {c.timelineDesc}
            </p>
          </div>

          <ol className="list-none p-0">
            {detail.timeline.map((row, i) => (
              <li
                key={i}
                className={`grid grid-cols-[120px_1fr] items-baseline gap-8 py-6 border-t border-[rgba(30,41,59,0.08)] ${
                  i === detail.timeline.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="font-sans text-[13px] tracking-[0.04em] tabular-nums text-[var(--color-bronze)]">
                  {row.t}&nbsp;<span className="text-[var(--color-text-muted)]">min</span>
                </div>
                <div>
                  <h3 className="mb-2 font-serif text-[22px] font-normal leading-[1.2] text-[var(--color-text)]">
                    {row[lang].h}
                  </h3>
                  <p className="max-w-[640px] text-[15px] leading-[1.65] text-[var(--color-text-muted)]">
                    {row[lang].p}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── For whom / Not for ─────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-8 md:grid-cols-2">

          {/* For whom — tinted card */}
          <div className={`rounded-2xl p-10 ${toneBgClass[svc.tone]}`}>
            <p className="mb-3.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
              {c.forWhomLabel}
            </p>
            <h3 className="mb-6 font-serif text-[26px] font-normal leading-[1.2] text-[var(--color-text)]">
              {c.forWhomHeading}
            </h3>
            <ul className="flex flex-col gap-3.5">
              {detail.forWhom[lang].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px] leading-[1.55] text-[var(--color-text)]">
                  <Check
                    size={16}
                    strokeWidth={1.5}
                    className="mt-0.5 shrink-0 text-[var(--color-bronze)]"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Not for — white card */}
          <div className="rounded-2xl bg-[var(--color-background)] p-10 shadow-[var(--shadow-sm)]">
            <p className="mb-3.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
              {c.notForLabel}
            </p>
            <h3 className="mb-6 font-serif text-[26px] font-normal leading-[1.2] text-[var(--color-text)]">
              {c.notForHeading}
            </h3>
            <ul className="flex flex-col gap-3.5">
              {detail.notFor[lang].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px] leading-[1.55] text-[var(--color-text-muted)]">
                  <span className="mt-[2px] shrink-0 font-sans text-[14px] leading-none text-[rgba(30,41,59,0.3)]">—</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-[rgba(30,41,59,0.08)] pt-5 text-[13px] italic leading-[1.6] text-[var(--color-text-muted)]">
              {c.notForFootnote}
            </p>
          </div>

        </div>
      </section>

      {/* ── Gallery ────────────────────────────────────────────────────── */}
      <section className="bg-[var(--color-background-soft)] py-20">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="mb-8">
            <p className="mb-3.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
              {c.spaceLabel}
            </p>
            <h2 className="font-serif text-3xl font-normal leading-[1.2] text-[var(--color-text)] lg:text-4xl">
              {c.spaceHeading}
            </h2>
          </div>

          <div className="grid grid-cols-[2fr_1fr_1fr] grid-rows-[200px_200px] gap-3.5">
            <div className="row-span-2 rounded-2xl bg-[#EFE8E1]" />
            <div className="rounded-2xl bg-[#E8EBF0]" />
            <div className="rounded-2xl bg-[#E4EDE4]" />
            <div className="rounded-2xl bg-[#E8EBF0]" />
            <div className="rounded-2xl bg-[#EFE8E1]" />
          </div>

          <p className="mt-4 text-center text-[13px] italic text-[var(--color-text-muted)]">
            {c.spaceCaption}
          </p>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-[820px] px-8">
          <p className="mb-3.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
            {c.faqLabel}
          </p>
          <h2 className="mb-10 font-serif text-4xl font-normal leading-[1.2] text-[var(--color-text)]">
            {c.faqHeading}
          </h2>
          <FaqAccordion items={detail.faq} />
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="bg-[var(--color-background-soft)] py-20">
        <div className="mx-auto max-w-[680px] px-8 text-center">
          <h2 className="mb-6 font-serif text-4xl font-light leading-[1.1] text-[var(--color-text)] lg:text-5xl">
            {c.ctaHead1}{" "}
            <em className="not-italic text-[var(--color-bronze)]">{c.ctaAccent}</em>{" "}
            {c.ctaHead2}
          </h2>
          <p className="mb-8 text-[17px] leading-[1.6] text-[var(--color-text-muted)]">
            {svc[lang].name} · {svc.duration} minutos · <ServicePriceDisplay price={price} />
          </p>
          <Button
            variant="primary"
            href="/reservar"
            icon={<Clock size={14} strokeWidth={1.5} />}
          >
            {c.ctaBook}
          </Button>
          <p className="mt-[18px] text-[13px] text-[var(--color-text-muted)]">
            {c.ctaNote}
          </p>
        </div>
      </section>

      {/* ── Related services ───────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-8">
          <p className="mb-3.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
            {c.relatedLabel}
          </p>
          <h2 className="mb-10 font-serif text-3xl font-normal leading-[1.2] text-[var(--color-text)] lg:text-4xl">
            {c.relatedHeading}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedServices.map((rs) => (
              <ServiceCard key={rs.id} svc={rs} />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
