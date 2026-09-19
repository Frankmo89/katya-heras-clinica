import { createClient } from "@supabase/supabase-js";
import { TiendaContent } from "./TiendaContent";
import { mapDbProduct, type DbProduct } from "@/data/shop";

export const metadata = {
  title: "Tienda · Katya Heras Clínica de Osteopatía",
  description:
    "Velas, aceites y objetos pequeños que prolongan el trabajo de la sesión en casa. Recógelos en tu próxima cita en Tecate.",
};

// Safety net on top of the on-demand revalidation triggered by
// /admin/tienda (see /api/revalidate-public): catches any change made
// outside that flow (e.g. a direct DB edit) within 5 minutes.
export const revalidate = 300;

export default async function TiendaPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data } = await supabase
    .from("products")
    .select("id, title_es, title_en, description_es, description_en, price, category, card_style, tone, images")
    .eq("is_active", true)
    .order("created_at");

  const products = (data ?? []).map((row) => mapDbProduct(row as DbProduct));

  return <TiendaContent products={products} />;
}
