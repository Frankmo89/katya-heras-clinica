import { notFound } from "next/navigation";
import { SERVICES, SERVICE_DETAIL } from "@/data/services";
import { ServiceDetailContent } from "./ServiceDetailContent";

// Static params for SSG
export function generateStaticParams() {
  return SERVICES.map((s) => ({ id: s.id }));
}

// Metadata
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const svc = SERVICES.find((s) => s.id === id);
  if (!svc) return {};
  return { title: `${svc.es.name} · Katya Heras Clínica`, description: svc.es.desc };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const svc    = SERVICES.find((s) => s.id === id);
  const detail = SERVICE_DETAIL[id];
  if (!svc || !detail) notFound();
  const serviceIndex = SERVICES.findIndex((s) => s.id === id) + 1;
  const relatedServices = detail.related
    .map((rid) => SERVICES.find((s) => s.id === rid))
    .filter(Boolean) as typeof SERVICES;
  return (
    <ServiceDetailContent
      svc={svc}
      detail={detail}
      relatedServices={relatedServices}
      serviceIndex={serviceIndex}
    />
  );
}
