// Shared type and fallback defaults for clinic contact settings.
// Imported by both ClinicSettingsContext and the admin configuration page
// so the shape stays in sync automatically.

import type { Currency } from '@/lib/format';
export type { Currency };

export type ClinicSettings = {
  id: number;
  whatsapp_number: string;
  contact_email: string;
  physical_address: string;
  maps_url: string;
  instagram_url: string | null;
  facebook_url: string | null;
  instructions_pre_appointment: string | null;
  instructions_arrival: string | null;
  /** Active currency for services and shop pricing. */
  currency: Currency;
  /** Hero section appearance — editable from the admin panel. */
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  /** Homepage: Philosophy & Testimonial section. */
  philosophy_image_url: string | null;
  testimonial_quote: string | null;
  testimonial_author: string | null;
  /** Ordered array of testimonials for the homepage carousel. */
  testimonials_list: { quote: string; author: string }[];
  /** About page: Practice section. */
  about_practice_image_url: string | null;
  about_practice_text: string | null;
  /** About page: Gallery images. */
  about_gallery_1_url: string | null;
  about_gallery_2_url: string | null;
  about_gallery_3_url: string | null;
  /** About page: Location image. */
  about_location_image_url: string | null;
};

/** Safe fallback shown while the DB fetch is in-flight or if it fails. */
export const CLINIC_SETTINGS_DEFAULTS: ClinicSettings = {
  id: 1,
  whatsapp_number: "+52 664 000 0000",
  contact_email: "katyamheras@gmail.com",
  physical_address: "Av. Hidalgo 142, Tecate, BC",
  maps_url: "https://maps.google.com/?q=Av+Hidalgo+142+Tecate+BC",
  instagram_url: null,
  facebook_url: null,
  instructions_pre_appointment: "Ropa cómoda y elástica\nEstudios médicos previos si los tienes\nUna botella de agua\nDiez minutos de margen para llegar sin prisa",
  instructions_arrival: "Estacionamiento gratuito en la calle paralela\nA 4 cuadras de la Línea Internacional\nCafé y té de bienvenida desde 10 min antes",
  currency: "MXN",
  hero_title: null,
  hero_subtitle: null,
  hero_image_url: null,
  philosophy_image_url: null,
  testimonial_quote: null,
  testimonial_author: null,
  testimonials_list: [],
  about_practice_image_url: null,
  about_practice_text: null,
  about_gallery_1_url: null,
  about_gallery_2_url: null,
  about_gallery_3_url: null,
  about_location_image_url: null,
};

/**
 * Parse an Instagram @handle from a full URL or bare handle.
 * Returns e.g. "@katya" or null — never invents a handle.
 */
export function instagramHandleFromUrl(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  // Bare handle (with or without leading @)
  if (/^@?[A-Za-z0-9._]{1,30}$/.test(trimmed)) {
    return `@${trimmed.replace(/^@/, "")}`;
  }

  try {
    const withScheme = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const u = new URL(withScheme);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    if (
      host !== "instagram.com" &&
      host !== "instagr.am" &&
      !host.endsWith(".instagram.com")
    ) {
      return null;
    }
    const seg = u.pathname.split("/").filter(Boolean)[0] || "";
    if (/^[A-Za-z0-9._]{1,30}$/.test(seg)) {
      return `@${seg}`;
    }
  } catch {
    return null;
  }
  return null;
}
