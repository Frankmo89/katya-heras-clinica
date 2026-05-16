import { SERVICES } from "@/data/services";
import { ServiceCard } from "@/components/ui/ServiceCard";

export const metadata = {
  title: "Servicios · Katya Heras Clínica de Osteopatía",
  description:
    "Tratamientos de osteopatía estructural, visceral, cráneo-sacral y más. Encuentra la sesión que tu cuerpo necesita.",
};

export default function ServiciosPage() {
  return (
    <div className="pt-[72px] pb-16 md:pb-24">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">

        {/* ── Header ── */}
        <div className="mb-10 md:mb-16 max-w-[680px]">
          <p className="mb-6 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
            Servicios
          </p>
          <h1 className="mb-6 font-serif text-[2.25rem] md:text-5xl font-light leading-[1.05] tracking-[-0.01em] text-[var(--color-text)] lg:text-6xl">
            Tratamientos pensados con calma.
          </h1>
          <p className="text-lg leading-[1.65] text-[var(--color-text-muted)]">
            Cada modalidad responde a una manera distinta de cargar el cuerpo.
            Si no estás segura cuál elegir, empieza por una{" "}
            <span className="text-[var(--color-text)]">lectura postural</span>.
          </p>
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((svc) => (
            <ServiceCard key={svc.id} svc={svc} />
          ))}
        </div>

      </div>
    </div>
  );
}
