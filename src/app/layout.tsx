import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { ClientProviders } from "@/components/providers/ClientProviders";
import { SiteChrome } from "@/components/layout/SiteChrome";
import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Single description for every page that doesn't set its own (only
// servicios/[id] currently does) — this is what WhatsApp/iMessage/Slack
// link previews show. There's no localized routing on this site (no
// /en/... segment), so link previews can't vary by viewer language the
// way the client-side ES/EN toggle does; this stays the one description
// shown to every viewer regardless of language.
const SITE_DESCRIPTION =
  "Osteopatía y masaje clínico para dolor de espalda, cuello y ciática. Tecate, BC — a minutos de San Diego. Reserva en línea.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Katya Heras Clínica de Osteopatía",
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "Katya Heras Clínica de Osteopatía",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Katya Heras Clínica de Osteopatía",
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${cormorantGaramond.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#F8FAFC] text-[#1E293B] font-sans">
        <ClientProviders>
          <SiteChrome>{children}</SiteChrome>
        </ClientProviders>
      </body>
    </html>
  );
}
