"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { UserPlus, Search, ChevronRight, Users, Pencil, Trash2, X } from "lucide-react";

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
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  useEffect(() => {
    if (editingPatient) {
      setEditForm({
        full_name: editingPatient.full_name,
        phone: editingPatient.phone ?? "",
        email: editingPatient.email ?? "",
      });
    }
  }, [editingPatient]);

  const filtered = useMemo(() => {
    if (!query.trim()) return patients;
    const q = query.toLowerCase();
    return patients.filter((p) => p.full_name.toLowerCase().includes(q));
  }, [patients, query]);

  async function handleDelete(p: Patient) {
    if (
      !window.confirm(
        `¿Eliminar el expediente de "${p.full_name}"?\n\nSe eliminarán también su historial clínico y evaluaciones físicas. Esta acción no se puede deshacer.`
      )
    )
      return;
    setDeleting(p.id);
    const { error } = await supabase.from("patients").delete().eq("id", p.id);
    setDeleting(null);
    if (error) {
      alert("No se pudo eliminar el expediente. Inténtalo de nuevo.");
      return;
    }
    setPatients((prev) => prev.filter((x) => x.id !== p.id));
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPatient) return;
    setSaving(true);
    const payload = {
      full_name: editForm.full_name.trim(),
      phone: editForm.phone.trim() || null,
      email: editForm.email.trim() || null,
    };
    const { error } = await supabase
      .from("patients")
      .update(payload)
      .eq("id", editingPatient.id);
    setSaving(false);
    if (error) {
      if (error.code === "23505") {
        alert("Ya existe un paciente registrado con ese número de teléfono.");
      } else {
        alert("No se pudo actualizar el expediente.");
      }
      return;
    }
    setPatients((prev) =>
      prev.map((p) => (p.id === editingPatient.id ? { ...p, ...payload } : p))
    );
    setEditingPatient(null);
  }

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
                    <div className="inline-flex items-center gap-3">
                      <button
                        onClick={() => setEditingPatient(p)}
                        title="Editar datos básicos"
                        className="text-slate-400 hover:text-[var(--color-bronze)] transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={deleting === p.id}
                        title="Eliminar expediente"
                        className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                      >
                        {deleting === p.id ? (
                          <svg className="animate-spin" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                            <path d="M12 2a10 10 0 0 1 10 10" />
                          </svg>
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                      <Link
                        href={`/admin/pacientes/${p.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-bronze)] hover:underline"
                      >
                        Ver Expediente <ChevronRight size={13} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* ── Edit Modal ──────────────────────────────────────────────── */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="font-serif text-2xl text-slate-800">Editar Paciente</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Actualiza los datos de contacto básicos.
                </p>
              </div>
              <button
                onClick={() => setEditingPatient(null)}
                className="ml-4 shrink-0 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-[var(--color-text)] transition-colors focus:border-[var(--color-bronze)] focus:outline-none focus:ring-2 focus:ring-[rgba(192,138,94,0.15)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-[var(--color-text)] transition-colors focus:border-[var(--color-bronze)] focus:outline-none focus:ring-2 focus:ring-[rgba(192,138,94,0.15)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-[var(--color-text)] transition-colors focus:border-[var(--color-bronze)] focus:outline-none focus:ring-2 focus:ring-[rgba(192,138,94,0.15)]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !editForm.full_name.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-bronze)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--color-bronze-hover)] disabled:opacity-60 transition-colors"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      Guardando…
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

