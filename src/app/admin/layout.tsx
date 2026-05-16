"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Menu } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
      if (!data.session && pathname !== "/admin/login") {
        router.replace("/admin/login");
      }
    });

    // Keep session in sync
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, newSession) => {
      setSession(newSession);
      if (!newSession && pathname !== "/admin/login") {
        router.replace("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  // Login page: render without sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Checking session: full-screen loader
  if (checking) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[var(--color-background-soft)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-bronze)] border-t-transparent" />
          <p className="text-sm text-[var(--color-text-muted)]">Verificando sesión…</p>
        </div>
      </div>
    );
  }

  // No session: redirect is in flight, render nothing
  if (!session) return null;

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[var(--color-background-soft)]">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:pl-64 min-h-[calc(100vh-72px)] overflow-auto">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-slate-50 hover:text-[var(--color-text)]"
            aria-label="Abrir menú"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
          <p className="font-serif text-[17px] leading-none text-[var(--color-text)]">
            Panel Clínico
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
