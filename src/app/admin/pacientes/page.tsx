"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { UserPlus, Search, ChevronRight, Users } from "lucide-react";

interface Patient {
  id: string;
  created_at: string;
  full_name: string;
  phone: string | null;
  email: string | null;
}

export default function PacientesPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function fetchPatients() {
      const { data, error } = await supabase
        .from("patients")
        .select("id, created_at, full_name, phone, email")
        .order("full_name", { ascending: true });
      if (!error) setPatients(data ?? []);
      setLoading(false);
    }
    fetchPatients();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return patients;
    const q = query.toLowerCase();
    return patients.filter((p) => p.full_name.toLowerCase().includes(q));
  }, [patients, query]);

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)] font-medium">
            Gestión Administrativa
          </span>
          <h1 className="font-serif text-4xl mt-2 text-slate-800">Expedientes Clínicos</h1>
        </div>
        <Link
          href="/admin/pacientes/nuevo"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-bronze)] px-5 py-3 text-sm font-medium text-white hover:bg-[var(--color-bronze-hover)] transition"
        >
          <UserPlus size={16} />
          Nuevo Paciente
        </Link>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        {/* Search bar */}
        <div className="flex items-center gap-3 border-b border-slate-50 bg-slate-50/50 px-6 py-4">
          <Search size={18} className="shrink-0 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre…"
            className="w-full bg-transparent text-sm text-[var(--color-text)] placeholder:text-slate-300 outline-none"
          />
          {query && (
            <span className="shrink-0 text-xs text-slate-400">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-8 py-4 font-medium">Nombre del Paciente</th>
              <th className="px-8 py-4 font-medium">Teléfono</th>
              <th className="px-8 py-4 font-medium">Correo</th>
              <th className="px-8 py-4 font-medium">Registro</th>
              <th className="px-8 py-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-sm text-slate-400">
                  Cargando expedientes…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Users size={32} strokeWidth={1} />
                    <p className="text-sm">
                      {query ? "No se encontraron pacientes con ese nombre." : "Aún no hay pacientes registrados."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="group transition-colors hover:bg-slate-50/80">
                  <td className="px-8 py-5">
                    <span className="font-serif text-[17px] text-slate-800">{p.full_name}</span>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-500">{p.phone ?? "—"}</td>
                  <td className="px-8 py-5 text-sm text-slate-400">{p.email ?? "—"}</td>
                  <td className="px-8 py-5 text-xs text-slate-400">
                    {new Date(p.created_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Link
                      href={`/admin/pacientes/${p.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-bronze)] hover:underline"
                    >
                      Ver Expediente <ChevronRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

