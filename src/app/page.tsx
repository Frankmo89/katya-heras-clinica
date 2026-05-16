import { createClient } from "@supabase/supabase-js";
import { HomeHeroSection } from "@/components/ui/HomeHeroSection";
import { HomeServicesSection } from "@/components/ui/HomeServicesSection";
import { HomePhilosophySection } from "@/components/ui/HomePhilosophySection";
import { HomeLocationSection } from "@/components/ui/HomeLocationSection";
import { mapDbService, type DbService } from "@/data/services";

export default async function HomePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [{ data: settings }, { data: servicesData }] = await Promise.all([
    supabase
      .from("clinic_settings")
      .select("hero_title, hero_subtitle, hero_image_url, philosophy_image_url, testimonials_list")
      .eq("id", 1)
      .single(),
    supabase
      .from("services")
      .select("id, title_es, title_en, subtitle_es, subtitle_en, description_es, description_en, duration_minutes, price, tone")
      .order("created_at"),
  ]);

  const services = (servicesData ?? []).map((row) => mapDbService(row as DbService));

  return (
    <div>
      <HomeHeroSection
        heroTitle={settings?.hero_title ?? null}
        heroSubtitle={settings?.hero_subtitle ?? null}
        heroImageUrl={settings?.hero_image_url ?? null}
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

