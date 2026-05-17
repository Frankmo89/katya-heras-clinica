"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  ClipboardList,
  Activity,
  Heart,
  Clock,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type TabId = "datos" | "antecedentes" | "exploracion" | "timeline";

interface DatosPersonales {
  full_name: string; birth_date: string; sex: string; phone: string;
  email: string; address: string; occupation: string; civil_status: string;
  emergency_contact: string; emergency_phone: string;
}
interface Antecedentes {
  chief_complaint: string; patologias: string[]; surgeries: string;
  accidents: string; allergies: string; current_medications: string;
  family_history: string; smoking: string; alcohol: string;
  exercise: string; gyneco_history: string;
}
interface ExploracionFisica {
  weight: string; height: string; heart_rate: string; bp_sys: string;
  bp_dia: string; resp_rate: string; temperature: string;
}
interface PmoRow { region: string; left: string; right: string; notes: string; }
interface LineaTiempo {
  gestacion: string; primera_infancia: string; infancia: string;
  adolescencia: string; vida_adulta: string; traumas: string;
  relacion_padres: string; contexto_actual: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const TABS: { id: TabId; label: string; icon: typeof ClipboardList }[] = [
  { id: "datos",        label: "Datos Personales",   icon: ClipboardList },
  { id: "antecedentes", label: "Antecedentes",        icon: Activity },
  { id: "exploracion",  label: "Exploración Física",  icon: Heart },
  { id: "timeline",     label: "Línea del Tiempo",    icon: Clock },
];

const PATHOLOGIES = [
  "Hipertensión Arterial",      "Enfermedades Cardiacas",
  "Problemas Circulatorios",    "Varices",
  "Diabetes Mellitus",          "Hipotiroidismo / Hipertiroidismo",
  "Osteoporosis",               "Enfermedades Renales",
  "Litiasis Renal",             "Asma",
  "EPOC",                       "Lesión Cerebral",
  "Epilepsia",                  "Migraña Crónica",
  "Hernias Discales",           "Artritis / Artralgia",
  "Escoliosis",                 "Cáncer (activo o en remisión)",
  "Embarazo",                   "Infecciones de Piel",
  "Alergias Severas",           "Trastornos Psiquiátricos",
  "Hepatitis / Enf. Hepáticas", "VIH / Enf. Autoinmunes",
];

const PMO_REGIONS = [
  "Pelvis / Ilíacos", "Sacro", "Lumbar L1–L5", "Dorsal D1–D12",
  "Cervical C1–C7", "Occipucio / Cráneo", "SBS (Esfenobasi)",
  "Costillas", "Hombros / Escápulas", "Diafragma",
];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-sans text-[15px] text-[var(--color-text)] transition-colors focus:border-[var(--color-bronze)] focus:outline-none focus:ring-2 focus:ring-[rgba(192,138,94,0.15)]";
const labelCls =
  "mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)]";
const sectionCls =
  "rounded-3xl border border-slate-100 bg-white p-8 shadow-[var(--shadow-sm)]";
const sectionHeadCls =
  "mb-6 flex items-center gap-3 text-[var(--color-bronze)]";

// ── Page ──────────────────────────────────────────────────────────────────
export default function NuevoPacientePage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("datos");

  const [datos, setDatos] = useState<DatosPersonales>({
    full_name: "", birth_date: "", sex: "", phone: "",
    email: "", address: "", occupation: "", civil_status: "",
    emergency_contact: "", emergency_phone: "",
  });
  const [antecedentes, setAntecedentes] = useState<Antecedentes>({
    chief_complaint: "", patologias: [], surgeries: "",
    accidents: "", allergies: "", current_medications: "",
    family_history: "", smoking: "", alcohol: "", exercise: "", gyneco_history: "",
  });
  const [exploracion, setExploracion] = useState<ExploracionFisica>({
    weight: "", height: "", heart_rate: "", bp_sys: "",
    bp_dia: "", resp_rate: "", temperature: "",
  });
  const [pmo, setPmo] = useState<PmoRow[]>(
    PMO_REGIONS.map((region) => ({ region, left: "", right: "", notes: "" }))
  );
  const [timeline, setTimeline] = useState<LineaTiempo>({
    gestacion: "", primera_infancia: "", infancia: "",
    adolescencia: "", vida_adulta: "", traumas: "",
    relacion_padres: "", contexto_actual: "",
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [saved,   setSaved]   = useState(false);

  const setDato = (k: keyof DatosPersonales, v: string) =>
    setDatos((p) => ({ ...p, [k]: v }));
  const setAnte = (k: keyof Omit<Antecedentes, "patologias">, v: string) =>
    setAntecedentes((p) => ({ ...p, [k]: v }));
  const setExpl = (k: keyof ExploracionFisica, v: string) =>
    setExploracion((p) => ({ ...p, [k]: v }));
  const setTime = (k: keyof LineaTiempo, v: string) =>
    setTimeline((p) => ({ ...p, [k]: v }));

  const togglePatologia = (val: string) =>
    setAntecedentes((p) => ({
      ...p,
      patologias: p.patologias.includes(val)
        ? p.patologias.filter((x) => x !== val)
        : [...p.patologias, val],
    }));

  const updatePmo = (i: number, key: keyof Omit<PmoRow, "region">, val: string) =>
    setPmo((prev) => prev.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));

  const bmi =
    exploracion.weight && exploracion.height
      ? (parseFloat(exploracion.weight) / Math.pow(parseFloat(exploracion.height) / 100, 2)).toFixed(1)
      : null;

  const handleSave = async () => {
    if (!datos.full_name.trim()) {
      setError("El nombre del paciente es obligatorio.");
      setTab("datos");
      return;
    }
    setLoading(true);
    setError(null);

    // ── Step 1: Upsert patient ────────────────────────────────────────────────
    // When a phone number is provided and a patient already has that number,
    // update their record and reuse their id — avoids patients_phone_key violations.
    const patientPayload = {
      full_name:         datos.full_name.trim(),
      birth_date:        datos.birth_date   || null,
      sex:               datos.sex          || null,
      phone:             datos.phone.trim() || null,
      email:             datos.email.trim() || null,
      address:           datos.address.trim() || null,
      occupation:        datos.occupation.trim() || null,
      civil_status:      datos.civil_status || null,
      emergency_contact: datos.emergency_contact.trim() || null,
      emergency_phone:   datos.emergency_phone.trim() || null,
    };

    const patientResult = datos.phone.trim()
      ? await supabase
          .from("patients")
          .upsert(patientPayload, { onConflict: "phone" })
          .select("id")
          .single()
      : await supabase
          .from("patients")
          .insert([patientPayload])
          .select("id")
          .single();

    if (patientResult.error || !patientResult.data) {
      setError(patientResult.error?.message ?? "No se pudo guardar el paciente. Verifica la conexión.");
      setLoading(false);
      return;
    }

    // ── Step 2: Resolve patient ID ─────────────────────────────────────────
    const patientId = patientResult.data.id;

    const [hErr, eErr] = await Promise.all([
      // ── Step 3: Insert clinical history ─────────────────────────────────
      supabase.from("patient_histories").insert([{
        patient_id: patientId,
        // ── Flat text columns (migration 0016) ──────────────────────────
        // Serialised as JSON strings so all sub-fields are preserved
        // in the text column and can be parsed when reading back.
        pathological_history: JSON.stringify({
          patologias:          antecedentes.patologias,
          surgeries:           antecedentes.surgeries,
          accidents:           antecedentes.accidents,
          allergies:           antecedentes.allergies,
          current_medications: antecedentes.current_medications,
          lifestyle: {
            smoking:  antecedentes.smoking,
            alcohol:  antecedentes.alcohol,
            exercise: antecedentes.exercise,
          },
          gyneco_history: antecedentes.gyneco_history,
        }),
        family_history:     antecedentes.family_history.trim()    || null,
        // emotional_timeline stores the full biographical timeline;
        // contexto_actual is the last field and maps directly to this column.
        emotional_timeline: JSON.stringify({
          gestacion:        timeline.gestacion,
          primera_infancia: timeline.primera_infancia,
          infancia:         timeline.infancia,
          adolescencia:     timeline.adolescencia,
          vida_adulta:      timeline.vida_adulta,
          traumas:          timeline.traumas,
          relacion_padres:  timeline.relacion_padres,
          contexto_actual:  timeline.contexto_actual,
        }),
        observations: antecedentes.chief_complaint.trim() || null,
      }]).then((r) => r.error),
      supabase.from("physical_evaluations").insert([{
        patient_id:               patientId,
        weight:                   exploracion.weight      ? parseFloat(exploracion.weight)      : null,
        height:                   exploracion.height      ? parseFloat(exploracion.height)      : null,
        bmi:                      bmi                     ? parseFloat(bmi)                     : null,
        heart_rate:               exploracion.heart_rate  ? parseInt(exploracion.heart_rate)    : null,
        blood_pressure_systolic:  exploracion.bp_sys      ? parseInt(exploracion.bp_sys)        : null,
        blood_pressure_diastolic: exploracion.bp_dia      ? parseInt(exploracion.bp_dia)        : null,
        respiratory_rate:         exploracion.resp_rate   ? parseInt(exploracion.resp_rate)     : null,
        temperature:              exploracion.temperature ? parseFloat(exploracion.temperature) : null,
        pmo_findings: Object.fromEntries(
          pmo.map((r) => [r.region, { left: r.left, right: r.right, notes: r.notes }])
        ),
      }]).then((r) => r.error),
    ]);

    setLoading(false);
    if (hErr || eErr) {
      setError("Paciente guardado, pero hubo un error en los registros clínicos.");
      return;
    }
    setSaved(true);
    setTimeout(() => router.push("/admin/pacientes"), 3000);
  };

  const TAB_IDS: TabId[] = ["datos", "antecedentes", "exploracion", "timeline"];
  const tabIdx = TAB_IDS.indexOf(tab);
  const isFirst = tabIdx === 0;
  const isLast  = tabIdx === TAB_IDS.length - 1;


  return (
    <div className="mx-auto max-w-4xl px-8 py-8 pb-20">

      {/* ── Success overlay ───────────────────────────────────────── */}
      {saved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-3xl bg-white p-12 text-center shadow-[var(--shadow-lg)]">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-green)]">
              <Check size={28} strokeWidth={1.5} className="text-[var(--color-bronze)]" />
            </div>
            <h2 className="font-serif text-[28px] font-light text-[var(--color-text)]">
              ¡Historia guardada!
            </h2>
            <p className="mt-2 text-[14px] leading-[1.6] text-[var(--color-text-muted)]">
              El expediente de{" "}
              <strong className="font-medium text-[var(--color-text)]">{datos.full_name}</strong>{" "}
              fue creado exitosamente.
            </p>
            <p className="mt-4 text-[12px] text-[var(--color-text-muted)]">
              Redirigiendo al listado…
            </p>
          </div>
        </div>
      )}

      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="mb-8">
        <a
          href="/admin/pacientes"
          className="mb-4 inline-flex items-center gap-2 text-[13px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Expedientes
        </a>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">Nuevo Registro</p>
        <h1 className="mt-1 font-serif text-[clamp(2rem,3vw,2.75rem)] font-light leading-[1.1] text-[var(--color-text)]">
          Nueva Historia Clínica
        </h1>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────── */}
      <div className="mb-8 flex overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[var(--shadow-sm)]">
        {TABS.map(({ id, label, icon: Icon }, i) => {
          const active = tab === id;
          const done   = TAB_IDS.indexOf(id) < tabIdx;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-1 cursor-pointer flex-col items-center gap-1.5 border-b-2 px-4 py-4 font-sans text-[12px] uppercase tracking-[0.12em] transition-all duration-200 ${
                active
                  ? "border-[var(--color-bronze)] bg-[rgba(192,138,94,0.04)] text-[var(--color-bronze)]"
                  : done
                  ? "border-transparent text-[var(--color-text-muted)] hover:bg-slate-50"
                  : "border-transparent text-[var(--color-text-muted)] opacity-60 hover:opacity-80"
              }`}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center">
                {done ? (
                  <Check size={14} strokeWidth={2} className="text-[var(--color-bronze)]" />
                ) : (
                  <Icon size={15} strokeWidth={1.5} />
                )}
              </span>
              <span className="hidden sm:block">{label}</span>
              <span className="text-[10px] opacity-50 sm:hidden">0{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* ════ TAB 1 — Datos Personales ════════════════════════════════ */}
      {tab === "datos" && (
        <div className="flex flex-col gap-6">
          <div className={sectionCls}>
            <div className={sectionHeadCls}>
              <ClipboardList size={22} strokeWidth={1.5} />
              <h2 className="font-serif text-[24px] font-normal text-[var(--color-text)]">Información Personal</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelCls}>Nombre Completo *</label>
                <input className={inputCls} value={datos.full_name} onChange={(e) => setDato("full_name", e.target.value)} placeholder="Nombre y apellidos" />
              </div>
              <div>
                <label className={labelCls}>Fecha de Nacimiento</label>
                <input type="date" className={inputCls} value={datos.birth_date} onChange={(e) => setDato("birth_date", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Sexo</label>
                <select className={inputCls} value={datos.sex} onChange={(e) => setDato("sex", e.target.value)}>
                  <option value="">Seleccionar…</option>
                  <option>Femenino</option><option>Masculino</option><option>Otro</option><option>Prefiero no decir</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Teléfono</label>
                <input className={inputCls} value={datos.phone} onChange={(e) => setDato("phone", e.target.value)} placeholder="+52 664 000 0000" />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} value={datos.email} onChange={(e) => setDato("email", e.target.value)} placeholder="correo@ejemplo.mx" />
              </div>
              <div>
                <label className={labelCls}>Estado Civil</label>
                <select className={inputCls} value={datos.civil_status} onChange={(e) => setDato("civil_status", e.target.value)}>
                  <option value="">Seleccionar…</option>
                  <option>Soltero/a</option><option>Casado/a</option><option>Unión libre</option><option>Divorciado/a</option><option>Viudo/a</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Ocupación</label>
                <input className={inputCls} value={datos.occupation} onChange={(e) => setDato("occupation", e.target.value)} placeholder="Profesión u oficio" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Dirección</label>
                <input className={inputCls} value={datos.address} onChange={(e) => setDato("address", e.target.value)} placeholder="Calle, colonia, ciudad" />
              </div>
            </div>
          </div>
          <div className={sectionCls}>
            <h3 className="mb-5 font-serif text-[18px] font-normal text-[var(--color-text)]">Contacto de Emergencia</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Nombre</label>
                <input className={inputCls} value={datos.emergency_contact} onChange={(e) => setDato("emergency_contact", e.target.value)} placeholder="Nombre del contacto" />
              </div>
              <div>
                <label className={labelCls}>Teléfono</label>
                <input className={inputCls} value={datos.emergency_phone} onChange={(e) => setDato("emergency_phone", e.target.value)} placeholder="+52 664 000 0000" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ TAB 2 — Antecedentes ════════════════════════════════════ */}
      {tab === "antecedentes" && (
        <div className="flex flex-col gap-6">
          <div className={sectionCls}>
            <div className={sectionHeadCls}>
              <Activity size={22} strokeWidth={1.5} />
              <h2 className="font-serif text-[24px] font-normal text-[var(--color-text)]">Motivo de Consulta</h2>
            </div>
            <label className={labelCls}>Describe el motivo principal</label>
            <textarea className={inputCls} rows={3} value={antecedentes.chief_complaint} onChange={(e) => setAnte("chief_complaint", e.target.value)} placeholder="¿Qué la trae a la clínica hoy?" />
          </div>

          <div className={sectionCls}>
            <h3 className="mb-2 font-serif text-[20px] font-normal text-[var(--color-text)]">Antecedentes Patológicos</h3>
            <p className="mb-5 text-[13px] text-[var(--color-text-muted)]">Marca todas las condiciones que apliquen (actuales o previas).</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PATHOLOGIES.map((opt) => (
                <label key={opt} className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-[14px] text-[var(--color-text)] transition-colors hover:border-slate-100 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={antecedentes.patologias.includes(opt)}
                    onChange={() => togglePatologia(opt)}
                    className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-[var(--color-bronze)]"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div className={sectionCls}>
            <h3 className="mb-5 font-serif text-[20px] font-normal text-[var(--color-text)]">Historial Clínico</h3>
            <div className="flex flex-col gap-5">
              <div>
                <label className={labelCls}>Cirugías previas y fechas</label>
                <textarea className={inputCls} rows={2} value={antecedentes.surgeries} onChange={(e) => setAnte("surgeries", e.target.value)} placeholder="Ej. Apendicectomía 2018, Cesárea 2021…" />
              </div>
              <div>
                <label className={labelCls}>Accidentes / Traumatismos</label>
                <textarea className={inputCls} rows={2} value={antecedentes.accidents} onChange={(e) => setAnte("accidents", e.target.value)} placeholder="Caídas, golpes, accidentes de tráfico…" />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Alergias conocidas</label>
                  <input className={inputCls} value={antecedentes.allergies} onChange={(e) => setAnte("allergies", e.target.value)} placeholder="Medicamentos, alimentos…" />
                </div>
                <div>
                  <label className={labelCls}>Medicamentos actuales</label>
                  <input className={inputCls} value={antecedentes.current_medications} onChange={(e) => setAnte("current_medications", e.target.value)} placeholder="Nombre y dosis" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Antecedentes Familiares relevantes</label>
                <textarea className={inputCls} rows={2} value={antecedentes.family_history} onChange={(e) => setAnte("family_history", e.target.value)} placeholder="Enfermedades heredofamiliares…" />
              </div>
            </div>
          </div>

          <div className={sectionCls}>
            <h3 className="mb-5 font-serif text-[20px] font-normal text-[var(--color-text)]">Hábitos y Estilo de Vida</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Tabaquismo</label>
                <select className={inputCls} value={antecedentes.smoking} onChange={(e) => setAnte("smoking", e.target.value)}>
                  <option value="">Seleccionar…</option>
                  <option>No</option><option>Exfumador/a</option><option>Ocasional</option><option>Regular</option><option>Frecuente</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Alcohol</label>
                <select className={inputCls} value={antecedentes.alcohol} onChange={(e) => setAnte("alcohol", e.target.value)}>
                  <option value="">Seleccionar…</option>
                  <option>No</option><option>Ocasional</option><option>Regular</option><option>Frecuente</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Ejercicio</label>
                <select className={inputCls} value={antecedentes.exercise} onChange={(e) => setAnte("exercise", e.target.value)}>
                  <option value="">Seleccionar…</option>
                  <option>Sedentario/a</option><option>Ligero (1–2 v/sem)</option><option>Moderado (3–4 v/sem)</option><option>Intenso (5+ v/sem)</option>
                </select>
              </div>
            </div>
            <div className="mt-5">
              <label className={labelCls}>Antecedentes Gineco-Obstétricos (si aplica)</label>
              <textarea className={inputCls} rows={2} value={antecedentes.gyneco_history} onChange={(e) => setAnte("gyneco_history", e.target.value)} placeholder="Ciclo menstrual, embarazos, partos, menopausia…" />
            </div>
          </div>
        </div>
      )}

      {/* ════ TAB 3 — Exploración Física ══════════════════════════════ */}
      {tab === "exploracion" && (
        <div className="flex flex-col gap-6">
          <div className={sectionCls}>
            <div className={sectionHeadCls}>
              <Heart size={22} strokeWidth={1.5} />
              <h2 className="font-serif text-[24px] font-normal text-[var(--color-text)]">Signos Vitales y Antropometría</h2>
            </div>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              <div>
                <label className={labelCls}>Peso (kg)</label>
                <input type="number" step="0.1" min="0" className={inputCls} value={exploracion.weight} onChange={(e) => setExpl("weight", e.target.value)} placeholder="65.0" />
              </div>
              <div>
                <label className={labelCls}>Talla (cm)</label>
                <input type="number" min="0" className={inputCls} value={exploracion.height} onChange={(e) => setExpl("height", e.target.value)} placeholder="165" />
              </div>
              <div>
                <label className={labelCls}>IMC (calculado)</label>
                <div className="flex h-[50px] items-center rounded-xl border border-slate-100 bg-slate-50 px-4 font-sans text-[15px] text-[var(--color-text-muted)]">
                  {bmi ?? "—"}
                </div>
              </div>
              <div>
                <label className={labelCls}>F.C. (lpm)</label>
                <input type="number" min="0" className={inputCls} value={exploracion.heart_rate} onChange={(e) => setExpl("heart_rate", e.target.value)} placeholder="72" />
              </div>
              <div>
                <label className={labelCls}>T.A. Sistólica</label>
                <input type="number" min="0" className={inputCls} value={exploracion.bp_sys} onChange={(e) => setExpl("bp_sys", e.target.value)} placeholder="120" />
              </div>
              <div>
                <label className={labelCls}>T.A. Diastólica</label>
                <input type="number" min="0" className={inputCls} value={exploracion.bp_dia} onChange={(e) => setExpl("bp_dia", e.target.value)} placeholder="80" />
              </div>
              <div>
                <label className={labelCls}>F.R. (rpm)</label>
                <input type="number" min="0" className={inputCls} value={exploracion.resp_rate} onChange={(e) => setExpl("resp_rate", e.target.value)} placeholder="16" />
              </div>
              <div>
                <label className={labelCls}>Temperatura (°C)</label>
                <input type="number" step="0.1" min="0" className={inputCls} value={exploracion.temperature} onChange={(e) => setExpl("temperature", e.target.value)} placeholder="36.5" />
              </div>
            </div>
          </div>

          <div className={sectionCls}>
            <h3 className="mb-2 font-serif text-[22px] font-normal text-[var(--color-text)]">
              P.M.O. — Prueba de Movilidad Osteopática
            </h3>
            <p className="mb-6 text-[13px] text-[var(--color-text-muted)]">
              Registra hallazgos por región. Deja vacías las áreas sin restricción.
            </p>
            <div className="mb-2 grid grid-cols-[1.8fr_1fr_1fr_1.4fr] gap-2 px-1">
              {["Región", "Hallazgo Izq.", "Hallazgo Der.", "Observaciones"].map((h) => (
                <p key={h} className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-bronze)]">{h}</p>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              {pmo.map((row, i) => (
                <div key={row.region} className="grid grid-cols-[1.8fr_1fr_1fr_1.4fr] items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                  <span className="font-sans text-[13px] font-medium text-[var(--color-text)]">{row.region}</span>
                  <input className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-sans text-[13px] focus:border-[var(--color-bronze)] focus:outline-none" value={row.left} onChange={(e) => updatePmo(i, "left", e.target.value)} placeholder="—" />
                  <input className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-sans text-[13px] focus:border-[var(--color-bronze)] focus:outline-none" value={row.right} onChange={(e) => updatePmo(i, "right", e.target.value)} placeholder="—" />
                  <input className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-sans text-[13px] focus:border-[var(--color-bronze)] focus:outline-none" value={row.notes} onChange={(e) => updatePmo(i, "notes", e.target.value)} placeholder="Notas…" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════ TAB 4 — Línea del Tiempo ════════════════════════════════ */}
      {tab === "timeline" && (
        <div className="flex flex-col gap-6">
          <div className={sectionCls}>
            <div className={sectionHeadCls}>
              <Clock size={22} strokeWidth={1.5} />
              <h2 className="font-serif text-[24px] font-normal text-[var(--color-text)]">
                Descripción de Línea del Tiempo
              </h2>
            </div>
            <p className="mb-7 text-[14px] leading-[1.65] text-[var(--color-text-muted)]">
              Registra los eventos significativos de la historia de vida del paciente con impacto somático o emocional.
            </p>
            <div className="flex flex-col gap-6">
              {(
                [
                  { key: "gestacion",        label: "Gestación y Parto",              ph: "Antecedentes perinatales, tipo de parto, complicaciones…" },
                  { key: "primera_infancia", label: "Primera Infancia (0–6 años)",    ph: "Enfermedades infantiles, hitos del desarrollo…" },
                  { key: "infancia",         label: "Infancia (6–12 años)",           ph: "Escuela, relaciones, traumas físicos o emocionales…" },
                  { key: "adolescencia",     label: "Adolescencia (12–18 años)",      ph: "Cambios físicos, emocionales, relaciones importantes…" },
                  { key: "vida_adulta",      label: "Vida Adulta",                    ph: "Trabajo, pareja, hijos, pérdidas importantes…" },
                  { key: "traumas",          label: "Traumas Físicos y Emocionales",  ph: "Accidentes, duelos, cirugías, alta tensión…" },
                  { key: "relacion_padres",  label: "Relación con Padres / Familia de Origen", ph: "Tipo de vínculo, dinámica familiar, figuras de apego…" },
                  { key: "contexto_actual",  label: "Contexto Actual",               ph: "Situación actual, fuentes de estrés o apoyo…" },
                ] as { key: keyof LineaTiempo; label: string; ph: string }[]
              ).map(({ key, label, ph }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <textarea className={inputCls} rows={3} value={timeline[key]} onChange={(e) => setTime(key, e.target.value)} placeholder={ph} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation buttons ────────────────────────────────────── */}
      <div className="mt-8 flex items-start justify-between gap-4">
        <div>
          {!isFirst && (
            <button
              onClick={() => setTab(TAB_IDS[tabIdx - 1])}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[rgba(30,41,59,0.15)] bg-white px-6 py-2.5 font-sans text-sm uppercase tracking-widest text-[var(--color-text)] transition-colors hover:bg-slate-50"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              Anterior
            </button>
          )}
        </div>
        <div className="flex flex-col items-end gap-3">
          {error && (
            <p className="max-w-[380px] text-right text-[13px] leading-[1.5] text-red-500">{error}</p>
          )}
          {!isLast ? (
            <button
              onClick={() => setTab(TAB_IDS[tabIdx + 1])}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--color-bronze)] px-6 py-2.5 font-sans text-sm uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-[var(--color-bronze-hover)]"
            >
              Siguiente
              <ArrowRight size={14} strokeWidth={1.5} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--color-bronze)] px-8 py-2.5 font-sans text-sm uppercase tracking-widest text-white shadow-sm transition-all hover:bg-[var(--color-bronze-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Guardando…
                </>
              ) : (
                <>
                  <Save size={14} strokeWidth={1.5} />
                  Guardar Historia Clínica
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
