"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
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
    <div className="flex min-h-[calc(100vh-72px)]">
      <AdminSidebar />
      <div className="flex-1 overflow-auto bg-[var(--color-background-soft)]">
        {children}
      </div>
    </div>
  );
}
