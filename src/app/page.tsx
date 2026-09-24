import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { HomeHeroSection } from "@/components/ui/HomeHeroSection";
import { HomeServicesSection } from "@/components/ui/HomeServicesSection";
import { HomePhilosophySection } from "@/components/ui/HomePhilosophySection";
import { HomeLocationSection } from "@/components/ui/HomeLocationSection";
import { ClinicJsonLd } from "@/components/ui/ClinicJsonLd";
import { mapDbService, type DbService } from "@/data/services";
import { SITE_ORIGIN } from "@/lib/clinicSettings";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: SITE_ORIGIN,
  },
};

export default async function HomePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [{ data: settings }, { data: servicesData }, { data: schedule }] =
    await Promise.all([
      supabase
        .from("clinic_settings")
        .select(
          "hero_title, hero_subtitle, hero_image_url, philosophy_image_url, testimonials_list, physical_address, maps_url, whatsapp_number, contact_email, instagram_url",
        )
        .eq("id", 1)
        .single(),
      supabase
        .from("services")
        .select(
          "id, title_es, title_en, subtitle_es, subtitle_en, description_es, description_en, duration_minutes, price, tone, hero_image",
        )
        .order("created_at"),
      supabase
        .from("clinic_schedule")
        .select("day_of_week, is_open, open_time, close_time")
        .order("day_of_week"),
    ]);

  const services = (servicesData ?? []).map((row) =>
    mapDbService(row as DbService),
  );

  return (
    <div>
      {settings && (
        <ClinicJsonLd
          physicalAddress={settings.physical_address}
          mapsUrl={settings.maps_url}
          whatsappNumber={settings.whatsapp_number}
          contactEmail={settings.contact_email}
          instagramUrl={settings.instagram_url}
          schedule={schedule ?? []}
        />
      )}
      <HomeHeroSection
        heroTitle={settings?.hero_title ?? null}
        heroSubtitle={settings?.hero_subtitle ?? null}
        heroImageUrl={settings?.hero_image_url ?? null}
        heroVideoUrl={process.env.NEXT_PUBLIC_HERO_VIDEO_URL ?? null}
      />
      <HomeServicesSection services={services} />
      <HomePhilosophySection
        philosophyImageUrl={settings?.philosophy_image_url ?? null}
        testimonialsList={settings?.testimonials_list ?? []}
      />
      <HomeLocationSection />
    </div>
  );
}
