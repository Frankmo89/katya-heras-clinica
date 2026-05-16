"use client";

import { LanguageProvider } from "@/context/LanguageContext";
import { ClinicSettingsProvider } from "@/context/ClinicSettingsContext";
import type { ReactNode } from "react";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ClinicSettingsProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </ClinicSettingsProvider>
  );
}
