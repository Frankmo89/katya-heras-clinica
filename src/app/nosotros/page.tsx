import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Clock, MapPin } from "lucide-react";

export default async function NosotrosPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data } = await supabase
    .from("clinic_settings")
    .select(
      "about_practice_image_url, about_practice_text, about_gallery_1_url, about_gallery_2_url, about_gallery_3_url, about_location_image_url",
    )
    .eq("id", 1)
    .single();

  const practiceImageUrl   = data?.about_practice_image_url  ?? null;
  const practiceText       = data?.about_practice_text       ?? null;
  const gallery1Url        = data?.about_gallery_1_url       ?? null;
  const gallery2Url        = data?.about_gallery_2_url       ?? null;
  const gallery3Url        = data?.about_gallery_3_url       ?? null;
  const locationImageUrl   = data?.about_location_image_url  ?? null;

  return (
    <div className="pt-[72px] pb-0">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">

        {/* ── Intro: Katya + text ── */}
        <div className="mb-14 md:mb-24 grid grid-cols-1 items-center gap-10 md:gap-16 md:grid-cols-[1fr_1.1fr]">
          {/* Practice photo */}
          {practiceImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={practiceImageUrl}
              alt="La práctica"
              className="w-full rounded-2xl object-cover"
              style={{ aspectRatio: "4/5" }}
            />
          ) : (
            <div className="w-full rounded-2xl bg-[#F2E8E8]" style={{ aspectRatio: "4/5" }} />
          )}

          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
              La práctica
            </p>
            <h1 className="mb-6 font-serif text-[1.875rem] md:text-4xl font-light leading-[1.1] tracking-tight text-[var(--color-text)] lg:text-6xl">
              Una clínica fundada en la escucha.
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
                  Katya Heras es osteópata certificada con más de doce años de
                  práctica clínica. Su trabajo combina la precisión de la osteopatía
                  estructural con la sutileza de las terapias craneo-sacrales.
                </p>
                <p className="text-[17px] leading-[1.65] text-[var(--color-text)]/60">
                  Cada sesión está diseñada para que el cuerpo, y el sistema
                  nervioso, recuerden cómo descansar.
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── The space ── */}
        <div className="mb-14 md:mb-24">
          <p className="mb-4 text-center text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
            El espacio
          </p>
          <h2 className="mb-14 text-center font-serif text-3xl font-normal leading-[1.2] text-[var(--color-text)] lg:text-4xl">
            Lino, madera y luz natural.
          </h2>

          {/* Gallery grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_1fr]">
            {/* Large */}
            {gallery1Url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gallery1Url}
                alt="El espacio 1"
                className="w-full rounded-2xl object-cover"
                style={{ aspectRatio: "4/3" }}
              />
            ) : (
              <div className="w-full rounded-2xl bg-[#E4EDE4]" style={{ aspectRatio: "4/3" }} />
            )}
            {/* Medium */}
            {gallery2Url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gallery2Url}
                alt="El espacio 2"
                className="w-full rounded-2xl object-cover"
                style={{ aspectRatio: "4/3" }}
              />
            ) : (
              <div className="w-full rounded-2xl bg-[#EFE8E1]" style={{ aspectRatio: "4/3" }} />
            )}
            {/* Small */}
            {gallery3Url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gallery3Url}
                alt="El espacio 3"
                className="w-full rounded-2xl object-cover"
                style={{ aspectRatio: "4/3" }}
              />
            ) : (
              <div className="w-full rounded-2xl bg-[#E8E8E4]" style={{ aspectRatio: "4/3" }} />
            )}
          </div>
        </div>

        {/* ── Cross-border / Location ── */}
        <div className="mb-14 md:mb-24 grid grid-cols-1 items-center gap-8 md:gap-12 rounded-2xl bg-[var(--color-background-soft)] px-6 py-10 md:px-16 md:py-14 md:grid-cols-2">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
              San Diego ↔ Tecate
            </p>
            <h3 className="mb-4 font-serif text-[28px] font-normal leading-[1.2] text-[var(--color-text)]">
              Cómo llegar.
            </h3>
            <p className="mb-6 text-[15px] leading-[1.65] text-[var(--color-text)]/60">
              A pocos minutos de la garita de Tecate. Estacionamiento privado y
              acceso peatonal directo.
            </p>

            <ul className="mb-8 flex flex-col gap-3.5 text-sm text-[var(--color-text)]">
              <li className="flex items-center gap-3">
                <MapPin
                  size={16}
                  className="shrink-0 text-[var(--color-bronze)]"
                  strokeWidth={1.5}
                />
                Av. Hidalgo 142, Tecate, BC
              </li>
              <li className="flex items-center gap-3">
                <Clock
                  size={16}
                  className="shrink-0 text-[var(--color-bronze)]"
                  strokeWidth={1.5}
                />
                Lun–Vie 09:00–18:00 · Sáb 10:00–14:00
              </li>
            </ul>

            <Button
              variant="primary"
              href="/reservar"
              icon={<ArrowRight size={14} strokeWidth={1.5} />}
            >
              Reservar una sesión
            </Button>
          </div>

          {/* Location image */}
          {locationImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={locationImageUrl}
              alt="Cómo llegar"
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
