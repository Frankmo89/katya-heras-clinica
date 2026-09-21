"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, CalendarCheck, TrendingUp, ChevronRight, UserPlus, AlertTriangle, CalendarClock } from "lucide-react";
import Link from "next/link";

interface Stats {
  totalPatients: number;
  todayBookings: number;
  monthBookings: number;
  futureSlots: number;
}

interface RecentPatient {
  id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}

const CARDS = [
  {
    label:  "Total Pacientes",
    key:    "totalPatients" as keyof Stats,
    suffix: "registrados",
    icon:   Users,
    bg:     "var(--color-surface-green)",
    href:   "/admin/pacientes",
  },
  {
    label:  "Citas Hoy",
    key:    "todayBookings" as keyof Stats,
    suffix: "agendadas",
    icon:   CalendarCheck,
    bg:     "var(--color-surface-pink)",
    href:   "/admin/citas?filter=today",
  },
  {
    label:  "Citas Este Mes",
    key:    "monthBookings" as keyof Stats,
    suffix: "en total",
    icon:   TrendingUp,
    bg:     "var(--color-surface-blue)",
    href:   "/admin/citas",
  },
] as const;

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    todayBookings: 0,
    monthBookings: 0,
    futureSlots: 0,
  });
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today        = new Date().toISOString().split("T")[0];
      const firstOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      )
        .toISOString()
        .split("T")[0];

      const [patientsRes, todayRes, monthRes, futureSlotsRes, recentRes] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("date", today),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .gte("date", firstOfMonth),
        // How many bookable slots remain — the cron/pg_cron job that
        // regenerates these can fail silently (Supabase plan without
        // pg_cron, a bug, an expired CRON_SECRET); this count is how Katya
        // notices before /reservar quietly runs dry.
        supabase
          .from("available_slots")
          .select("id", { count: "exact", head: true })
          .gt("start_time", new Date().toISOString()),
        supabase
          .from("patients")
          .select("id, full_name, phone, created_at")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      setStats({
        totalPatients: patientsRes.count ?? 0,
        todayBookings: todayRes.count   ?? 0,
        monthBookings: monthRes.count   ?? 0,
        futureSlots:   futureSlotsRes.count ?? 0,
      });
      setRecentPatients((recentRes.data as RecentPatient[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const now = new Date();
  const dateLabel = now.toLocaleDateString("es-MX", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  });

  return (
    <div className="mx-auto max-w-6xl p-8">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
          Panel Clínico
        </p>
        <h1 className="mt-2 font-serif text-[clamp(2rem,3vw,3rem)] font-light leading-[1.1] text-[var(--color-text)]">
          Bienvenida, Katya
        </h1>
        <p className="mt-1 capitalize text-[14px] text-[var(--color-text-muted)]">
          {dateLabel}
        </p>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────── */}
      <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {CARDS.map(({ label, key, suffix, icon: Icon, bg, href }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col gap-4 rounded-3xl p-8 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            style={{ background: bg }}
          >
            <div className="flex items-start justify-between">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/60 text-[var(--color-bronze)]">
                <Icon size={20} strokeWidth={1.5} />
              </div>
              <ChevronRight
                size={16}
                strokeWidth={1.5}
                className="mt-1 text-[var(--color-text-muted)] transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </div>
            <div>
              <p className="font-serif text-[clamp(2.2rem,3.5vw,3rem)] font-light leading-none text-[var(--color-text)]">
                {loading ? "—" : stats[key]}
              </p>
              <p className="mt-1.5 text-[13px] text-[var(--color-text-muted)]">
                {suffix}
              </p>
              <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)]/70">
                {label}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Available-slots watchdog ────────────────────────────────
          The nightly regeneration job can fail silently (pg_cron
          unavailable on this Supabase plan, an expired CRON_SECRET, a
          bug) — this is how Katya notices before /reservar quietly shows
          nothing to book. Graduated: red once it's actually empty, amber
          once it's getting low, plain otherwise. */}
      {!loading && (
        <Link
          href="/admin/citas"
          className={`mb-10 flex items-center gap-4 rounded-3xl p-6 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${
            stats.futureSlots === 0
              ? "bg-red-50 text-red-700"
              : stats.futureSlots < 20
              ? "bg-amber-50 text-amber-700"
              : "bg-white text-[var(--color-text)]"
          }`}
        >
          <div
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
              stats.futureSlots === 0
                ? "bg-red-100"
                : stats.futureSlots < 20
                ? "bg-amber-100"
                : "bg-[var(--color-surface-blue)]"
            }`}
          >
            {stats.futureSlots < 20 ? (
              <AlertTriangle size={18} strokeWidth={1.5} />
            ) : (
              <CalendarClock size={18} strokeWidth={1.5} className="text-[var(--color-bronze)]" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-serif text-[20px] font-light leading-none">
              {stats.futureSlots}{" "}
              <span className="text-[13px] font-sans font-normal">
                horarios disponibles (próximos 60 días)
              </span>
            </p>
            {stats.futureSlots === 0 ? (
              <p className="mt-1 text-[13px]">
                No hay horarios — revisa la generación nocturna en /admin/citas o corre{" "}
                <code className="rounded bg-red-100 px-1 py-0.5 text-[12px]">
                  generate_available_slots
                </code>{" "}
                manualmente.
              </p>
            ) : stats.futureSlots < 20 ? (
              <p className="mt-1 text-[13px]">Quedan pocos — vale la pena revisar pronto.</p>
            ) : (
              <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
                La calendarización nocturna está funcionando.
              </p>
            )}
          </div>
          <ChevronRight size={16} strokeWidth={1.5} className="shrink-0 text-[var(--color-text-muted)]" />
        </Link>
      )}

      {/* ── Recent patients ─────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-100 bg-white shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between border-b border-slate-50 px-8 py-6">
          <h2 className="font-serif text-[22px] font-normal text-[var(--color-text)]">
            Pacientes Recientes
          </h2>
          <Link
            href="/admin/pacientes/nuevo"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-bronze)] px-5 py-2 font-sans text-[12px] uppercase tracking-widest text-white transition-colors hover:bg-[var(--color-bronze-hover)]"
          >
            <UserPlus size={14} strokeWidth={1.5} />
            Nuevo
          </Link>
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <p className="p-10 text-center text-[14px] text-[var(--color-text-muted)]">
              Cargando…
            </p>
          ) : recentPatients.length === 0 ? (
            <p className="p-10 text-center text-[14px] text-[var(--color-text-muted)]">
              Sin pacientes registrados aún.
            </p>
          ) : (
            recentPatients.map((p) => (
              <Link
                key={p.id}
                href={`/admin/pacientes/${p.id}`}
                className="flex items-center justify-between px-8 py-5 transition-colors hover:bg-slate-50/70"
              >
                <div>
                  <p className="font-serif text-[18px] text-[var(--color-text)]">
                    {p.full_name}
                  </p>
                  <p className="text-[13px] text-[var(--color-text-muted)]">
                    {p.phone ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-[12px] text-[var(--color-text-muted)]">
                    {new Date(p.created_at).toLocaleDateString("es-MX")}
                  </p>
                  <ChevronRight
                    size={16}
                    strokeWidth={1.5}
                    className="text-[var(--color-text-muted)]"
                  />
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="border-t border-slate-50 px-8 py-4 text-right">
          <Link
            href="/admin/pacientes"
            className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-bronze)] transition-colors hover:text-[var(--color-bronze-hover)]"
          >
            Ver todos los expedientes
            <ChevronRight size={13} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}
