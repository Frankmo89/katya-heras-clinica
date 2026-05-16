"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogIn } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      setLoading(false);
    } else {
      router.push("/admin");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[var(--color-background-soft)] px-6 py-12">
      <div className="w-full max-w-[420px]">

        {/* Brand heading */}
        <div className="mb-10 text-center">
          <p className="font-serif text-[34px] leading-none text-[var(--color-text)]">
            Katya Heras
          </p>
          <p className="mt-2.5 text-[11px] uppercase tracking-[0.22em] text-[var(--color-bronze)]">
            Panel Clínico · Acceso Interno
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleLogin}
          className="rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.07)]"
        >
          <h2 className="mb-6 font-serif text-xl text-slate-700">Iniciar Sesión</h2>

          {/* Email */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@kayaheras.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-slate-300 outline-none transition focus:border-[var(--color-bronze)] focus:bg-white focus:ring-2 focus:ring-[rgba(192,138,94,0.18)]"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
              Contraseña
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-slate-300 outline-none transition focus:border-[var(--color-bronze)] focus:bg-white focus:ring-2 focus:ring-[rgba(192,138,94,0.18)]"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-center text-xs text-red-500">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-bronze)] py-3 text-sm font-medium text-white transition hover:bg-[var(--color-bronze-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Entrando…
              </>
            ) : (
              <>
                <LogIn size={16} />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
