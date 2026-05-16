"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const NAV_LINKS = {
  es: [
    { label: "Inicio",    href: "/" },
    { label: "Servicios", href: "/servicios" },
    { label: "Tienda",    href: "/tienda" },
    { label: "Nosotros",  href: "/nosotros" },
  ],
  en: [
    { label: "Home",     href: "/" },
    { label: "Services", href: "/servicios" },
    { label: "Shop",     href: "/tienda" },
    { label: "About",    href: "/nosotros" },
  ],
} as const;

function LanguageToggle({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useLanguage();
  return (
    <div
      className={`inline-flex rounded-full p-[3px] text-xs ${
        dark
          ? "border border-[var(--color-text)]/15 bg-[var(--color-background-soft)]"
          : "border border-[var(--color-text)]/10 bg-white"
      }`}
    >
      {(["es", "en"] as const).map((L) => (
        <button
          key={L}
          onClick={() => setLang(L)}
          className={`cursor-pointer rounded-full px-3 py-1.5 font-sans font-medium transition-all duration-300 ${
            lang === L
              ? "bg-[var(--color-bronze)] text-white"
              : "bg-transparent text-[var(--color-text)]/50 hover:text-[var(--color-text)]"
          }`}
        >
          {L.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function SiteHeader() {
  const pathname  = usePathname();
  const { lang }  = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Close when the route changes (Link click already calls close, but
  // this covers programmatic navigation and back/forward).
  useEffect(() => { setIsOpen(false); }, [pathname]);

  // Scroll lock while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const links = NAV_LINKS[lang];

  return (
    <>
      {/* ── Desktop / shared sticky bar ──────────────────────────── */}
      <div className="sticky top-4 z-50 px-4 md:px-8">
        <nav className="mx-auto flex max-w-[1200px] items-center justify-between rounded-full border border-[var(--color-text)]/10 bg-white/80 px-6 py-3 shadow-sm backdrop-blur-[14px]">

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Katya Heras"
              width={160}
              height={64}
              className="h-12 md:h-16 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden items-center gap-8 md:flex">
            {links.map(({ label, href }) => {
              const isActive = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`border-b py-1.5 font-sans text-sm transition-colors duration-300 ${
                      isActive
                        ? "border-[var(--color-bronze)] font-medium text-[var(--color-bronze)]"
                        : "border-transparent font-normal text-[var(--color-text)] hover:text-[var(--color-bronze)]"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Language toggle — hidden on mobile (inside drawer instead) */}
            <span className="hidden md:inline-flex">
              <LanguageToggle />
            </span>

            {/* Desktop CTA */}
            <Link
              href="/reservar"
              className="hidden rounded-full bg-[var(--color-bronze)] px-[22px] py-2.5 font-sans text-[13px] uppercase tracking-widest text-white transition-colors duration-200 hover:bg-[var(--color-bronze-hover)] md:inline-flex"
            >
              {lang === "es" ? "Agendar Cita" : "Book Appointment"}
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center justify-center rounded-full p-2.5 text-[var(--color-text)] transition-colors hover:bg-[var(--color-background-soft)] md:hidden"
              aria-label={lang === "es" ? "Abrir menú" : "Open menu"}
              aria-expanded={isOpen}
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>
          </div>

        </nav>
      </div>

      {/* ── Mobile full-screen drawer ─────────────────────────────── */}
      <div
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-[100] flex flex-col bg-white transition-all duration-500 ease-out md:hidden ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-3 pointer-events-none"
        }`}
      >
        {/* Top bar: logo + close */}
        <div className="flex items-center justify-between px-8 py-5">
          <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center">
            <Image
              src="/logo.png"
              alt="Katya Heras"
              width={140}
              height={56}
              className="h-14 w-auto object-contain"
            />
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center rounded-full p-2.5 text-[var(--color-text)] transition-colors hover:bg-[var(--color-background-soft)]"
            aria-label={lang === "es" ? "Cerrar menú" : "Close menu"}
          >
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        {/* Hairline */}
        <div className="mx-8 border-t border-[rgba(30,41,59,0.08)]" />

        {/* Nav links — centered, large serif */}
        <nav className="flex flex-1 flex-col items-center justify-center gap-1 px-8">
          {links.map(({ label, href }, i) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                style={{
                  transitionDelay: isOpen ? `${80 + i * 55}ms` : "0ms",
                }}
                className={`block font-serif text-[clamp(2.75rem,8vw,4.5rem)] font-light leading-[1.1] transition-all duration-500 ${
                  isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                } ${
                  isActive
                    ? "text-[var(--color-bronze)]"
                    : "text-[var(--color-text)] hover:text-[var(--color-bronze)]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Hairline */}
        <div className="mx-8 border-t border-[rgba(30,41,59,0.08)]" />

        {/* Bottom: CTA + language toggle */}
        <div className="flex flex-col items-center gap-5 px-8 py-10">
          <Link
            href="/reservar"
            onClick={() => setIsOpen(false)}
            className="w-full max-w-[360px] rounded-full bg-[var(--color-bronze)] py-4 text-center font-sans text-sm uppercase tracking-widest text-white transition-colors duration-200 hover:bg-[var(--color-bronze-hover)]"
          >
            {lang === "es" ? "Reservar una sesión" : "Book a session"}
          </Link>
          <LanguageToggle dark />
        </div>

      </div>
    </>
  );
}

