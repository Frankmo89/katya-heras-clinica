"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  ShoppingBag,
  Settings,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",     href: "/admin",               icon: LayoutDashboard },
  { label: "Pacientes",     href: "/admin/pacientes",     icon: Users },
  { label: "Citas",         href: "/admin/citas",         icon: CalendarDays },
  { label: "Servicios",     href: "/admin/servicios",     icon: Stethoscope },
  { label: "Tienda",        href: "/admin/tienda",        icon: ShoppingBag },
  { label: "Configuración", href: "/admin/configuracion", icon: Settings },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-100 bg-white">
      {/* Brand strip */}
      <div className="border-b border-slate-50 px-6 py-5">
        <p className="font-serif text-[20px] leading-none text-[var(--color-text)]">
          Katya Heras
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Panel Clínico
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-4 py-[10px] text-[13.5px] transition-all duration-200 ${
                active
                  ? "bg-[rgba(192,138,94,0.10)] font-medium text-[var(--color-bronze)]"
                  : "text-[var(--color-text-muted)] hover:bg-slate-50 hover:text-[var(--color-text)]"
              }`}
            >
              <Icon size={16} strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-50 px-3 py-4 flex flex-col gap-1">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-[10px] text-[13.5px] text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-500 transition-all duration-200"
        >
          <LogOut size={16} strokeWidth={1.5} />
          Cerrar Sesión
        </button>
        <p className="px-4 pt-1 text-[11px] text-[var(--color-text-muted)]">
          v1.0 · Uso interno
        </p>
      </div>
    </aside>
  );
}
