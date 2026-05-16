import { createClient } from "@supabase/supabase-js";
import { HomeHeroSection } from "@/components/ui/HomeHeroSection";
import { HomeServicesSection } from "@/components/ui/HomeServicesSection";
import { HomePhilosophySection } from "@/components/ui/HomePhilosophySection";
import { HomeLocationSection } from "@/components/ui/HomeLocationSection";

export default async function HomePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data } = await supabase
    .from("clinic_settings")
    .select("hero_title, hero_subtitle, hero_image_url, philosophy_image_url, testimonials_list")
    .eq("id", 1)
    .single();

  return (
    <div>
      <HomeHeroSection
        heroTitle={data?.hero_title ?? null}
        heroSubtitle={data?.hero_subtitle ?? null}
        heroImageUrl={data?.hero_image_url ?? null}
      />
      <HomeServicesSection />
      <HomePhilosophySection
        philosophyImageUrl={data?.philosophy_image_url ?? null}
        testimonialsList={data?.testimonials_list ?? []}
      />
      <HomeLocationSection />
    </div>
  );
}

