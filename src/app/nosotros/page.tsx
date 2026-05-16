import { createClient } from "@supabase/supabase-js";
import { NosotrosContent } from "./NosotrosContent";

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

  return (
    <NosotrosContent
      practiceImageUrl={data?.about_practice_image_url  ?? null}
      practiceText={    data?.about_practice_text       ?? null}
      gallery1Url={     data?.about_gallery_1_url       ?? null}
      gallery2Url={     data?.about_gallery_2_url       ?? null}
      gallery3Url={     data?.about_gallery_3_url       ?? null}
      locationImageUrl={data?.about_location_image_url  ?? null}
    />
  );
}
