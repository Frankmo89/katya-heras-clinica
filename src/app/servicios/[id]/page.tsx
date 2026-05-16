import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Clock } from "lucide-react";
import { SERVICES, SERVICE_DETAIL, type ServiceTone } from "@/data/services";
import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/ui/ServiceCard";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { ServicePriceDisplay } from "@/components/ui/ServicePriceDisplay";

// ── Static params for SSG ──────────────────────────────────────────────────
export function generateStaticParams() {
  return SERVICES.map((s) => ({ id: s.id }));
}

// ── Metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const svc = SERVICES.find((s) => s.id === id);
  if (!svc) return {};
  return {
    title: `${svc.es.name} · Katya Heras Clínica`,
    description: svc.es.desc,
  };
}

// ── Tone → surface CSS variable ───────────────────────────────────────────
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

// ── Page ──────────────────────────────────────────────────────────────────
export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const svc    = SERVICES.find((s) => s.id === id);
  const detail = SERVICE_DETAIL[id];
  if (!svc || !detail) notFound();

  const serviceIndex = SERVICES.findIndex((s) => s.id === id) + 1;
  const relatedServices = detail.related
    .map((rid) => SERVICES.find((s) => s.id === rid))
    .filter(Boolean) as typeof SERVICES;

  return (
    <div>

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1200px] px-8 pb-2 pt-6">
        <Link
          href="/servicios"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-bronze)]"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          Servicios
        </Link>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="pb-20 pt-10">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 px-8 md:grid-cols-[1.15fr_1fr]">

          {/* Left — copy */}
          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
              {detail.hero.es.eyebrow}
            </p>
            <p className="mb-[18px] text-[11px] uppercase tracking-[0.16em] text-[var(--color-bronze)]">
              {detail.hero.es.kicker}
            </p>
            <h1 className="mb-7 font-serif text-5xl font-light leading-[1.05] tracking-[-0.01em] text-[var(--color-text)] lg:text-[clamp(2.5rem,4.6vw,4.5rem)]">
              {detail.hero.es.head}
            </h1>
            <p className="mb-9 max-w-[520px] text-lg leading-[1.65] text-[var(--color-text-muted)]">
              {detail.hero.es.lede}
            </p>

            {/* Duration + price meta */}
            <div className="mb-9 flex flex-wrap items-center gap-8">
              <div>
                <p className="mb-1.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">Duración</p>
                <p className="font-serif text-2xl text-[var(--color-text)]">
                  {svc.duration}&nbsp;<span className="text-[13px] text-[var(--color-text-muted)]">min</span>
                </p>
              </div>
              <div className="hidden h-8 w-px self-stretch bg-[rgba(30,41,59,0.08)] md:block" />
              <div>
                <p className="mb-1.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">Inversión</p>
                <p className="font-serif text-2xl text-[var(--color-text)]">
                  <ServicePriceDisplay price={Number(svc.price.replace(/,/g, ''))} />
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
                Reservar esta sesión
              </Button>
              <Button variant="ghost" href="/reservar">
                Ver disponibilidad
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
            {/* Bronze radial glow */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 70% 40%, rgba(192,138,94,0.18), transparent 55%)",
              }}
            />
            {/* Service index + duration label */}
            <div className="absolute left-8 right-8 top-8 flex justify-between font-sans text-[11px] uppercase tracking-[0.16em] text-black/40">
              <span>№ {String(serviceIndex).padStart(2, "0")}</span>
              <span>{svc.duration} min</span>
            </div>
            {/* Large decorative word */}
            <div
              className="absolute bottom-9 left-9 right-9 font-serif text-[120px] font-light leading-none tracking-[-0.04em] text-black/[0.08]"
            >
              {detail.hero.es.kicker.split(" ")[0]}.
            </div>
            {/* Inner border ring */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-[rgba(192,138,94,0.18)]" />
          </div>

        </div>
      </section>

      {/* ── Timeline ───────────────────────────────────────────────────── */}
      <section className="bg-[var(--color-background-soft)] py-20">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="mb-12 max-w-[560px]">
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
              La sesión
            </p>
            <h2 className="mb-4 font-serif text-4xl font-normal leading-[1.15] text-[var(--color-text)]">
              Qué esperar, minuto a minuto.
            </h2>
            <p className="text-base leading-[1.65] text-[var(--color-text-muted)]">
              No me gusta que llegues sin saber lo que va a pasar. Esto es un mapa, no un guion.
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
                    {row.es.h}
                  </h3>
                  <p className="max-w-[640px] text-[15px] leading-[1.65] text-[var(--color-text-muted)]">
                    {row.es.p}
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
              Buena opción si
            </p>
            <h3 className="mb-6 font-serif text-[26px] font-normal leading-[1.2] text-[var(--color-text)]">
              Esta sesión es para ti si…
            </h3>
            <ul className="flex flex-col gap-3.5">
              {detail.forWhom.es.map((item, i) => (
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
              Honestidad clínica
            </p>
            <h3 className="mb-6 font-serif text-[26px] font-normal leading-[1.2] text-[var(--color-text)]">
              Cuándo no es la indicada.
            </h3>
            <ul className="flex flex-col gap-3.5">
              {detail.notFor.es.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px] leading-[1.55] text-[var(--color-text-muted)]">
                  <span className="mt-[2px] shrink-0 font-sans text-[14px] leading-none text-[rgba(30,41,59,0.3)]">—</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-[rgba(30,41,59,0.08)] pt-5 text-[13px] italic leading-[1.6] text-[var(--color-text-muted)]">
              Si dudas, reserva una Lectura postural primero. Es más corta y barata, y salimos con un plan claro.
            </p>
          </div>

        </div>
      </section>

      {/* ── Gallery ────────────────────────────────────────────────────── */}
      <section className="bg-[var(--color-background-soft)] py-20">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="mb-8">
            <p className="mb-3.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
              El espacio
            </p>
            <h2 className="font-serif text-3xl font-normal leading-[1.2] text-[var(--color-text)] lg:text-4xl">
              Diseñado para soltar.
            </h2>
          </div>

          {/* Gallery grid: large image spans 2 rows */}
          <div className="grid grid-cols-[2fr_1fr_1fr] grid-rows-[200px_200px] gap-3.5">
            <div className="row-span-2 rounded-2xl bg-[#EFE8E1]" />
            <div className="rounded-2xl bg-[#E8EBF0]" />
            <div className="rounded-2xl bg-[#E4EDE4]" />
            <div className="rounded-2xl bg-[#E8EBF0]" />
            <div className="rounded-2xl bg-[#EFE8E1]" />
          </div>

          <p className="mt-4 text-center text-[13px] italic text-[var(--color-text-muted)]">
            Camilla térmica · luz cálida regulable · sonido aislado · té de bienvenida.
          </p>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-[820px] px-8">
          <p className="mb-3.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
            Preguntas honestas
          </p>
          <h2 className="mb-10 font-serif text-4xl font-normal leading-[1.2] text-[var(--color-text)]">
            Lo que la gente pregunta antes.
          </h2>
          <FaqAccordion items={detail.faq} />
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="bg-[var(--color-background-soft)] py-20">
        <div className="mx-auto max-w-[680px] px-8 text-center">
          <h2 className="mb-6 font-serif text-4xl font-light leading-[1.1] text-[var(--color-text)] lg:text-5xl">
            ¿Lista para{" "}
            <em className="not-italic text-[var(--color-bronze)]">una hora</em>{" "}
            sin prisa?
          </h2>
          <p className="mb-8 text-[17px] leading-[1.6] text-[var(--color-text-muted)]">
            {svc.es.name} · {svc.duration} minutos · <ServicePriceDisplay price={Number(svc.price.replace(/,/g, ''))} />
          </p>
          <Button
            variant="primary"
            href="/reservar"
            icon={<Clock size={14} strokeWidth={1.5} />}
          >
            Reservar esta sesión
          </Button>
          <p className="mt-[18px] text-[13px] text-[var(--color-text-muted)]">
            Confirmación inmediata · Política de cancelación 24h
          </p>
        </div>
      </section>

      {/* ── Related services ───────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-8">
          <p className="mb-3.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
            Quizá también
          </p>
          <h2 className="mb-10 font-serif text-3xl font-normal leading-[1.2] text-[var(--color-text)] lg:text-4xl">
            Otras sesiones que combinan bien.
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
