import {
  SITE_ORIGIN,
  instagramProfileUrl,
  resolveMapsUrl,
  whatsappDigits,
} from "@/lib/clinicSettings";
import { toOpeningHoursSpecification } from "@/lib/clinicSchedule";

type ScheduleRow = {
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
};

type ClinicJsonLdProps = {
  name?: string;
  physicalAddress: string;
  mapsUrl: string;
  whatsappNumber: string;
  contactEmail: string;
  instagramUrl: string | null;
  schedule: ScheduleRow[];
};

/** Server-rendered MedicalBusiness JSON-LD for local SEO. */
export function ClinicJsonLd({
  name = "Katya Heras",
  physicalAddress,
  mapsUrl,
  whatsappNumber,
  contactEmail,
  instagramUrl,
  schedule,
}: ClinicJsonLdProps) {
  const digits = whatsappDigits(whatsappNumber);
  const telephone = digits ? `+${digits}` : undefined;
  const ig = instagramProfileUrl(instagramUrl);
  const maps = resolveMapsUrl(mapsUrl, physicalAddress);

  // Address string from CMS is free-form; expose a structured PostalAddress
  // with known locality (Tecate) while keeping streetAddress as the full line.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["MedicalBusiness", "LocalBusiness"],
    name,
    url: SITE_ORIGIN,
    image: `${SITE_ORIGIN}/opengraph-image.png`,
    telephone,
    email: contactEmail || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: physicalAddress,
      addressLocality: "Tecate",
      addressRegion: "Baja California",
      addressCountry: "MX",
    },
    geo: undefined,
    hasMap: maps,
    openingHoursSpecification: toOpeningHoursSpecification(schedule),
    sameAs: ig ? [ig] : undefined,
  };

  // Drop undefined keys for cleaner markup
  const cleaned = JSON.parse(JSON.stringify(jsonLd));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleaned) }}
    />
  );
}
