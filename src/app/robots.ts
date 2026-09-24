import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/clinicSettings";

export default function robots(): MetadataRoute.Robots {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || SITE_ORIGIN;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api", "/api/"],
      },
    ],
    sitemap: `${origin.replace(/\/$/, "")}/sitemap.xml`,
  };
}
