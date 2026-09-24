import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_ORIGIN } from "@/lib/clinicSettings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || SITE_ORIGIN).replace(/\/$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${origin}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/servicios`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${origin}/nosotros`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${origin}/reservar`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/tienda`, changeFrequency: "weekly", priority: 0.6 },
  ];

  let serviceRoutes: MetadataRoute.Sitemap = [];
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const supabase = createClient(url, key);
      const { data } = await supabase
        .from("services")
        .select("id, created_at")
        .eq("is_active", true)
        .order("created_at");
      serviceRoutes = (data ?? []).map((row) => ({
        url: `${origin}/servicios/${row.id}`,
        lastModified: row.created_at ? new Date(row.created_at) : undefined,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      }));
    }
  } catch {
    // Sitemap must still build if DB is unreachable at build time.
  }

  return [...staticRoutes, ...serviceRoutes];
}
