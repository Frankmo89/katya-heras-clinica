import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { ClientProviders } from "@/components/providers/ClientProviders";
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

export const metadata: Metadata = {
  title: "Katya Heras Clínica de Osteopatía",
  description: "Osteopatía y bienestar holístico en Tecate, BC. Una sesión a la vez.",
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
          <SiteHeader />
          <main className="flex flex-col flex-1">{children}</main>
          <SiteFooter />
        </ClientProviders>
      </body>
    </html>
  );
}
