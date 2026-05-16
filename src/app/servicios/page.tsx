import { createClient } from "@supabase/supabase-js";
import { ServiciosContent } from "./ServiciosContent";
import { mapDbService, type DbService } from "@/data/services";

export const metadata = {
  title: "Servicios · Katya Heras Clínica de Osteopatía",
  description:
    "Tratamientos de osteopatía estructural, visceral, cráneo-sacral y más. Encuentra la sesión que tu cuerpo necesita.",
};

export default async function ServiciosPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data } = await supabase
    .from("services")
    .select("id, title_es, title_en, subtitle_es, subtitle_en, description_es, description_en, duration_minutes, price, tone")
    .order("created_at");

  const services = (data ?? []).map((row) => mapDbService(row as DbService));

  return <ServiciosContent services={services} />;
}
