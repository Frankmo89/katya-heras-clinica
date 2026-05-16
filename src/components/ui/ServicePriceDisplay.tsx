"use client";

// Thin client wrapper that reads currency from context and formats a service
// price. Consumed by the server-rendered servicios/[id] page so the price
// reacts to the Katya's currency setting without requiring a full client boundary.

import { useClinicSettings } from "@/context/ClinicSettingsContext";
import { formatPrice } from "@/lib/format";

interface ServicePriceDisplayProps {
  /** Numeric price (e.g. 1800). Pass the string price parsed: Number(svc.price.replace(/,/g, '')) */
  price: number;
  className?: string;
}

export function ServicePriceDisplay({ price, className }: ServicePriceDisplayProps) {
  const { settings } = useClinicSettings();
  return (
    <span className={className}>
      {formatPrice(price, settings.currency)}
    </span>
  );
}
