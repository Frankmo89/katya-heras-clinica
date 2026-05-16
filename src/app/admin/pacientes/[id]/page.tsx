"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  AlertTriangle,
  Activity,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────
interface Patient {
  id: string;
  created_at: string;
  full_name: string;
  birth_date: string | null;
  sex: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  occupation: string | null;
  civil_status: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
}

interface PatientHistory {
  id: string;
  created_at: string;
  observations: string | null;
  pathological_history: string | null;
  family_history: string | null;
  emotional_timeline: string | null;
}

interface PhysicalEvaluation {
  id: string;
  created_at: string;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  heart_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  pmo_findings: Record<string, { left: string; right: string; notes: string }> | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function calcAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Try to parse a JSON string; return the object or null on failure. */
function tryParse<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed as T;
  } catch {
    return null;
  }
}

// ── Micro-components ────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-[var(--color-bronze)]">{icon}</span>
      <div>
        <p className="text-[10px] uppercase tracking-[0.14em] font-medium text-slate-400">{label}</p>
        <p className="text-sm text-slate-700 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function VitalCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null | undefined;
  unit: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-center">
      <p className="text-[10px] uppercase tracking-[0.14em] font-medium text-slate-400 mb-1">{label}</p>
      {value != null ? (
        <p className="font-serif text-2xl text-slate-800">
          {value}
          <span className="ml-1 text-xs font-sans font-normal text-slate-400">{unit}</span>
        </p>
      ) : (
        <p className="text-slate-300 text-lg">—</p>
      )}
    </div>
  );
}

function HistoryField({ label, value }: { label: string; value: string | undefined }) {
  if (!value?.trim()) return null;
  return (
    <div className="mb-4">
      <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[var(--color-bronze)] mb-1.5">
        {label}
      </p>
      <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
      <div className="mb-7 flex items-center gap-3">
        <span className="text-[var(--color-bronze)]">{icon}</span>
        <h2 className="font-serif text-xl text-slate-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function PacienteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [patient,  setPatient]  = useState<Patient | null>(null);
  const [history,  setHistory]  = useState<PatientHistory | null>(null);
  const [eval_,    setEval]     = useState<PhysicalEvaluation | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      const [{ data: p }, { data: hArr }, { data: eArr }] = await Promise.all([
        supabase
          .from("patients")
          .select(
            "id, created_at, full_name, birth_date, sex, phone, email, address, occupation, civil_status, emergency_contact, emergency_phone"
          )
          .eq("id", id)
          .single(),
        supabase
          .from("patient_histories")
          .select(
            "id, created_at, observations, pathological_history, family_history, emotional_timeline"
          )
          .eq("patient_id", id)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("physical_evaluations")
          .select(
            "id, created_at, weight, height, bmi, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, respiratory_rate, temperature, pmo_findings"
          )
          .eq("patient_id", id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      if (!p) { setNotFound(true); setLoading(false); return; }
      setPatient(p as Patient);
      setHistory((hArr?.[0] as PatientHistory) ?? null);
      setEval((eArr?.[0] as PhysicalEvaluation) ?? null);
      setLoading(false);
    }
    load();
  }, [id]);

  // Parse serialised JSON columns
  const pathHx = tryParse<{
    patologias?: string[];
    surgeries?: string;
    accidents?: string;
    allergies?: string;
    current_medications?: string;
    lifestyle?: { smoking?: string; alcohol?: string; exercise?: string };
    gyneco_history?: string;
  }>(history?.pathological_history);

  const emotTimeline = tryParse<{
    gestacion?: string;
    primera_infancia?: string;
    infancia?: string;
    adolescencia?: string;
    vida_adulta?: string;
    traumas?: string;
    relacion_padres?: string;
    contexto_actual?: string;
  }>(history?.emotional_timeline);

  const age = patient?.birth_date ? calcAge(patient.birth_date) : null;
  const hasPmo = eval_?.pmo_findings && Object.keys(eval_.pmo_findings).length > 0;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center p-24 text-slate-400 text-sm">
        Cargando expediente…
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (notFound || !patient) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Link
          href="/admin/pacientes"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-[var(--color-bronze)] transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Expedientes Clínicos
        </Link>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <AlertTriangle size={28} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-400">Paciente no encontrado.</p>
        </div>
      </div>
    );
  }

  const p = patient;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* ── Back + Header ─────────────────────────────────────────────── */}
      <div>
        <Link
          href="/admin/pacientes"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-[var(--color-bronze)] transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Expedientes Clínicos
        </Link>

        {/* Patient masthead */}
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)] font-medium">
                Expediente Clínico
              </span>
              <h1 className="font-serif text-4xl mt-2 text-slate-800">{p.full_name}</h1>
              {/* Age / Sex / Civil status chips */}
              <div className="mt-3 flex flex-wrap gap-2">
                {age !== null && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {age} años
                  </span>
                )}
                {p.birth_date && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                    {formatDate(p.birth_date)}
                  </span>
                )}
                {p.sex && (
                  <span className="rounded-full bg-[rgba(192,138,94,0.12)] px-3 py-1 text-xs font-medium text-[var(--color-bronze)]">
                    {p.sex}
                  </span>
                )}
                {p.civil_status && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                    {p.civil_status}
                  </span>
                )}
              </div>
            </div>
            <p className="shrink-0 text-xs text-slate-400">
              Alta:{" "}
              <span className="font-medium text-slate-500">
                {formatDate(p.created_at)}
              </span>
            </p>
          </div>

          {/* Contact / demo info grid */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow icon={<Phone size={14} />} label="Teléfono" value={p.phone} />
            <InfoRow icon={<Mail size={14} />} label="Correo" value={p.email} />
            <InfoRow icon={<MapPin size={14} />} label="Dirección" value={p.address} />
            <InfoRow icon={<Briefcase size={14} />} label="Ocupación" value={p.occupation} />
            <InfoRow
              icon={<User size={14} />}
              label="Contacto de Emergencia"
              value={
                p.emergency_contact
                  ? `${p.emergency_contact}${p.emergency_phone ? ` · ${p.emergency_phone}` : ""}`
                  : null
              }
            />
          </div>
        </div>
      </div>

      {/* ── Historial Clínico ─────────────────────────────────────────── */}
      {history && (
        <SectionCard
          icon={<ClipboardListIcon />}
          title="Historial Clínico"
        >
          {/* Chief complaint */}
          {history.observations && (
            <div className="mb-8 rounded-2xl bg-[rgba(192,138,94,0.06)] border border-[rgba(192,138,94,0.18)] px-6 py-5">
              <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[var(--color-bronze)] mb-2">
                Motivo de Consulta
              </p>
              <p className="text-[16px] leading-relaxed text-slate-800 italic">
                &ldquo;{history.observations}&rdquo;
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-x-12 gap-y-0 md:grid-cols-2">
            {/* Left column — Antecedentes Patológicos */}
            <div>
              <h3 className="mb-5 text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 border-b border-slate-100 pb-2">
                Antecedentes Patológicos
              </h3>

              {/* Pathologies as tags */}
              {pathHx?.patologias && pathHx.patologias.length > 0 && (
                <div className="mb-5">
                  <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[var(--color-bronze)] mb-2">
                    Patologías
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {pathHx.patologias.map((pat) => (
                      <span
                        key={pat}
                        className="rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700"
                      >
                        {pat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <HistoryField label="Cirugías / Intervenciones" value={pathHx?.surgeries} />
              <HistoryField label="Accidentes / Traumatismos" value={pathHx?.accidents} />
              <HistoryField label="Alergias" value={pathHx?.allergies} />
              <HistoryField label="Medicación Actual" value={pathHx?.current_medications} />

              {/* Lifestyle */}
              {(pathHx?.lifestyle?.smoking ||
                pathHx?.lifestyle?.alcohol ||
                pathHx?.lifestyle?.exercise) && (
                <div className="mb-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[var(--color-bronze)] mb-2">
                    Hábitos
                  </p>
                  <div className="space-y-1">
                    {pathHx.lifestyle?.smoking && (
                      <p className="text-[13px] text-slate-600">
                        <span className="font-medium text-slate-700">Tabaco:</span>{" "}
                        {pathHx.lifestyle.smoking}
                      </p>
                    )}
                    {pathHx.lifestyle?.alcohol && (
                      <p className="text-[13px] text-slate-600">
                        <span className="font-medium text-slate-700">Alcohol:</span>{" "}
                        {pathHx.lifestyle.alcohol}
                      </p>
                    )}
                    {pathHx.lifestyle?.exercise && (
                      <p className="text-[13px] text-slate-600">
                        <span className="font-medium text-slate-700">Ejercicio:</span>{" "}
                        {pathHx.lifestyle.exercise}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <HistoryField label="Historial Ginecológico" value={pathHx?.gyneco_history} />
            </div>

            {/* Right column — Antecedentes Familiares */}
            <div>
              <h3 className="mb-5 text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 border-b border-slate-100 pb-2">
                Antecedentes Familiares
              </h3>
              {history.family_history ? (
                <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {history.family_history}
                </p>
              ) : (
                <p className="text-sm text-slate-300 italic">Sin antecedentes registrados.</p>
              )}
            </div>
          </div>

          {/* Línea del Tiempo Emocional — full width */}
          {emotTimeline && (
            <div className="mt-10">
              <h3 className="mb-6 text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 border-b border-slate-100 pb-2">
                Línea del Tiempo Emocional
              </h3>
              <div className="relative pl-6">
                {/* Vertical line */}
                <div className="absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--color-bronze)] via-[rgba(192,138,94,0.3)] to-transparent" />

                {(
                  [
                    ["Gestación",       emotTimeline.gestacion],
                    ["Primera Infancia",emotTimeline.primera_infancia],
                    ["Infancia",        emotTimeline.infancia],
                    ["Adolescencia",    emotTimeline.adolescencia],
                    ["Vida Adulta",     emotTimeline.vida_adulta],
                    ["Traumas",         emotTimeline.traumas],
                    ["Relación con Padres", emotTimeline.relacion_padres],
                    ["Contexto Actual", emotTimeline.contexto_actual],
                  ] as [string, string | undefined][]
                )
                  .filter(([, v]) => v?.trim())
                  .map(([label, value], i) => (
                    <div key={i} className="mb-6 last:mb-0">
                      {/* Dot */}
                      <div className="absolute left-0 mt-1.5 h-[9px] w-[9px] rounded-full bg-[var(--color-bronze)] -translate-x-[2px]" />
                      <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[var(--color-bronze)] mb-1">
                        {label}
                      </p>
                      <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                        {value}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Exploración Física ────────────────────────────────────────── */}
      {eval_ && (
        <SectionCard
          icon={<Activity size={18} />}
          title="Exploración Física"
        >
          {/* Vitals grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
            <VitalCard label="Peso" value={eval_.weight} unit="kg" />
            <VitalCard label="Talla" value={eval_.height} unit="cm" />
            <VitalCard label="IMC" value={eval_.bmi} unit="" />
            <VitalCard label="Frec. Cardiaca" value={eval_.heart_rate} unit="lpm" />
            <VitalCard label="T/A Sistólica" value={eval_.blood_pressure_systolic} unit="mmHg" />
            <VitalCard label="T/A Diastólica" value={eval_.blood_pressure_diastolic} unit="mmHg" />
            <VitalCard label="Frec. Respiratoria" value={eval_.respiratory_rate} unit="rpm" />
            <VitalCard label="Temperatura" value={eval_.temperature} unit="°C" />
          </div>

          {/* PMO Findings table */}
          {hasPmo && (
            <>
              <h3 className="mb-4 text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 border-b border-slate-100 pb-2">
                Hallazgos P.M.O.
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 pr-6 text-[10px] uppercase tracking-wider font-medium text-slate-400">Región</th>
                      <th className="pb-3 pr-6 text-[10px] uppercase tracking-wider font-medium text-slate-400">Izquierda</th>
                      <th className="pb-3 pr-6 text-[10px] uppercase tracking-wider font-medium text-slate-400">Derecha</th>
                      <th className="pb-3 text-[10px] uppercase tracking-wider font-medium text-slate-400">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {Object.entries(eval_.pmo_findings!).map(([region, vals]) => {
                      if (!vals.left && !vals.right && !vals.notes) return null;
                      return (
                        <tr key={region} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 pr-6 font-medium text-slate-700">{region}</td>
                          <td className="py-2.5 pr-6 text-slate-500">
                            {vals.left || <span className="text-slate-300">—</span>}
                          </td>
                          <td className="py-2.5 pr-6 text-slate-500">
                            {vals.right || <span className="text-slate-300">—</span>}
                          </td>
                          <td className="py-2.5 text-slate-500">
                            {vals.notes || <span className="text-slate-300">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </SectionCard>
      )}

      {/* Empty state when no clinical data exists yet */}
      {!history && !eval_ && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <AlertTriangle size={28} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-400">
            Aún no hay historial clínico registrado para este paciente.
          </p>
          <Link
            href={`/admin/pacientes/nuevo`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-bronze)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-bronze-hover)] transition"
          >
            Crear Historia Clínica
          </Link>
        </div>
      )}
    </div>
  );
}

// Inline icon to avoid importing duplicate from Lucide (ClipboardList conflicts with no-alias rule)
function ClipboardListIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}
