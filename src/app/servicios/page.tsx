import { createClient } from "@supabase/supabase-js";
import { ServiciosContent } from "./ServiciosContent";
import { mapDbService, type DbService } from "@/data/services";

export const metadata = {
  title: "Servicios · Katya Heras Clínica de Osteopatía",
  description:
    "Tratamientos de osteopatía estructural, visceral, cráneo-sacral y más. Encuentra la sesión que tu cuerpo necesita.",
};

// Safety net on top of the on-demand revalidation triggered by
// /admin/servicios (see /api/revalidate-public): catches any change made
// outside that flow (e.g. a direct DB edit) within 5 minutes.
export const revalidate = 300;

export default async function ServiciosPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data } = await supabase
    .from("services")
    .select("id, title_es, title_en, subtitle_es, subtitle_en, description_es, description_en, duration_minutes, price, tone, hero_image")
    .eq("is_active", true)
    .order("created_at");

  const services = (data ?? []).map((row) => mapDbService(row as DbService));

  return <ServiciosContent services={services} />;
}
