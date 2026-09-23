"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";

/**
 * Public marketing chrome (header + footer). Admin routes render their own
 * shell in src/app/admin/layout.tsx, so they must not inherit SiteHeader/
 * SiteFooter from the root layout — otherwise /admin stacks both bars.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </>
  );
}
