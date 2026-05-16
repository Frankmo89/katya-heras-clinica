"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays, Plus, Trash2, Check, AlertCircle,
  MessageCircle, Search, X, ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SERVICES } from "@/data/services";

// ── Types ──────────────────────────────────────────────────────────────────
type AdminSlot = {
  id: string;
  service_id: string | null;
  start_time: string;
};

type Booking = {
  id: string;
  booking_ref: string | null;
  service_id: string;
  date: string;
  time: string;
  patient_name: string;
  patient_email: string | null;
  patient_phone: string | null;
  notes: string | null;
  status: string;
  is_manual: boolean;
  is_cancelled: boolean;
  created_at: string;
};

type Feedback = { type: "success" | "error"; message: string };

type Patient = {
  id: string;
  full_name: string;  // matches patients.full_name from migration 0002
  email: string | null;
  phone: string | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────
function formatSlotTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("es-MX", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }),
    time: d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

function formatBookingDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "short", day: "numeric", month: "short",
  });
}

/** Build a WhatsApp deep-link Katya can use to message a patient directly. */
function buildPatientWhatsAppUrl(
  phone: string,
  b: { patientName: string; serviceName: string; date: string; time: string; bookingRef: string | null }
): string {
  const clean     = phone.replace(/\D/g, "");
  const dateLabel = new Date(b.date + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  });
  const msg = [
    `Hola ${b.patientName} 🌿`,
    "",
    "Te escribo de la Clínica Katya Heras para recordarte tu cita:",
    `· ${b.serviceName}`,
    `· ${dateLabel} a las ${b.time} h`,
    b.bookingRef ? `Ref: ${b.bookingRef}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

function StatusBadge({ status }: { status: string }) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap";
  if (status === "completed")
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700`}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Completada
      </span>
    );
  if (status === "cancelled")
    return (
      <span className={`${base} bg-red-50 text-red-600`}>
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />Cancelada
      </span>
    );
  return (
    <span className={`${base} bg-blue-50 text-blue-700`}>
      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />Confirmada
    </span>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function CitasPage() {
  const [activeTab, setActiveTab] = useState<"agenda" | "citas">("agenda");
  const [feedback,  setFeedback]  = useState<Feedback | null>(null);

  const showFeedback = (fb: Feedback) => {
    setFeedback(fb);
    setTimeout(() => setFeedback(null), 4500);
  };

  // ── Agenda tab ─────────────────────────────────────────────────────────
  const [slots,       setSlots]       = useState<AdminSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [newDateTime, setNewDateTime] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
  });
  const [adding,      setAdding]      = useState(false);

  // ── Citas tab ──────────────────────────────────────────────────────────
  const [bookings,        setBookings]        = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [search,          setSearch]          = useState("");

  // Manual booking form state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualSlotId,   setManualSlotId]   = useState("");
  const [manualService,  setManualService]  = useState(SERVICES[0]?.id ?? "");
  const [manualName,     setManualName]     = useState("");
  const [manualEmail,    setManualEmail]    = useState("");
  const [manualPhone,    setManualPhone]    = useState("");
  const [manualNotes,    setManualNotes]    = useState("");
  const [savingManual,   setSavingManual]   = useState(false);

  // Patient typeahead
  const [patients,            setPatients]            = useState<Patient[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient,     setSelectedPatient]     = useState<Patient | null>(null);

  // ── Fetch functions ────────────────────────────────────────────────────
  const fetchSlots = useCallback(async () => {
    setSlotsLoading(true);
    const { data, error } = await supabase
      .from("available_slots")
      .select("id, service_id, start_time")
      .eq("is_booked", false)
      .gt("start_time", new Date().toISOString())
      .order("start_time");
    if (error) console.error("Error fetching slots:", error);
    setSlots(data ?? []);
    setSlotsLoading(false);
  }, []);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("is_cancelled", false)
      .order("date", { ascending: true })
      .order("time", { ascending: true });
    if (error) console.error("Error fetching bookings:", error);
    // Filter out admin-cancelled; handles case where migration 0014 hasn't run yet
    const filtered = (data ?? []).filter(
      (b: Booking) => !b.status || b.status !== "cancelled"
    );
    setBookings(filtered);
    setBookingsLoading(false);
  }, []);

  const fetchPatients = useCallback(async () => {
    const { data } = await supabase
      .from("patients")
      .select("id, full_name, email, phone")
      .order("full_name");
    setPatients(data ?? []);
  }, []);

  useEffect(() => {
    fetchSlots();
    fetchBookings();
    fetchPatients();
  }, [fetchSlots, fetchBookings, fetchPatients]);

  // ── Agenda actions ─────────────────────────────────────────────────────
  const addSlot = async () => {
    if (!newDateTime) return;
    setAdding(true);
    const { error } = await supabase
      .from("available_slots")
      .insert({ start_time: new Date(newDateTime).toISOString() });
    setAdding(false);
    if (error) {
      showFeedback({
        type: "error",
        message:
          error.code === "23505"
            ? "Ya existe un horario para esa fecha y hora."
            : "Error al añadir el horario.",
      });
    } else {
      showFeedback({ type: "success", message: "Horario añadido correctamente." });
      setNewDateTime("");
      fetchSlots();
    }
  };

  const deleteSlot = async (id: string) => {
    const { error } = await supabase.from("available_slots").delete().eq("id", id);
    if (error) showFeedback({ type: "error", message: "Error al eliminar el horario." });
    else setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  // ── Citas actions ──────────────────────────────────────────────────────
  const updateBookingStatus = async (id: string, status: "completed" | "cancelled") => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      showFeedback({ type: "error", message: "Error al actualizar la cita." });
    } else {
      setBookings((prev) =>
        status === "cancelled"
          ? prev.filter((b) => b.id !== id)
          : prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
      showFeedback({
        type: "success",
        message:
          status === "completed" ? "Cita marcada como completada." : "Cita cancelada.",
      });
    }
  };

  const resetManualForm = () => {
    setManualSlotId("");
    setManualService(SERVICES[0]?.id ?? "");
    setManualName("");
    setManualEmail("");
    setManualPhone("");
    setManualNotes("");
    setSelectedPatient(null);
    setShowPatientDropdown(false);
  };

  const selectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setManualName(p.full_name);
    setManualEmail(p.email ?? "");
    setManualPhone(p.phone ?? "");
    setShowPatientDropdown(false);
  };

  const clearSelectedPatient = () => {
    setSelectedPatient(null);
    setManualName("");
    setManualEmail("");
    setManualPhone("");
  };

  const saveManualBooking = async () => {
    if (!manualSlotId || !manualName.trim()) return;
    setSavingManual(true);

    const slot = slots.find((s) => s.id === manualSlotId);
    if (!slot) { setSavingManual(false); return; }

    const d       = new Date(slot.start_time);
    const dateIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const ref     = `KH-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const { error: bookingError } = await supabase.from("bookings").insert({
      service_id:    manualService,
      date:          dateIso,
      time:          timeStr,
      patient_name:  manualName.trim(),
      patient_email: manualEmail.trim() || null,
      patient_phone: manualPhone.trim() || null,
      notes:         manualNotes.trim() || null,
      booking_ref:   ref,
      is_manual:     true,
      status:        "confirmed",
    });

    if (bookingError) {
      showFeedback({ type: "error", message: "Error al guardar la cita." });
      setSavingManual(false);
      return;
    }

    // Mark slot as booked
    const { error: slotError } = await supabase
      .from("available_slots")
      .update({ is_booked: true })
      .eq("id", manualSlotId);
    if (slotError) console.warn("Could not mark slot as booked:", slotError);

    setSavingManual(false);
    showFeedback({ type: "success", message: `Cita creada. Ref: ${ref}` });
    setShowManualForm(false);
    resetManualForm();
    fetchSlots();
    fetchBookings();
  };

  // ── Derived ────────────────────────────────────────────────────────────
  /** Patients whose name contains what Katya has typed so far (max 8). */
  const filteredPatients =
    !selectedPatient && manualName.trim().length >= 1
      ? patients
          .filter((p) =>
            p.full_name.toLowerCase().includes(manualName.toLowerCase().trim())
          )
          .slice(0, 8)
      : [];

  const filteredBookings = bookings.filter(
    (b) =>
      search.trim() === "" ||
      b.patient_name.toLowerCase().includes(search.toLowerCase().trim())
  );

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)] font-medium">
        Citas
      </span>
      <h1 className="font-serif text-4xl mt-2 mb-6 text-slate-800">Gestión de Citas</h1>

      {/* Feedback toast */}
      {feedback && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          {feedback.type === "success" ? (
            <Check size={16} strokeWidth={2} />
          ) : (
            <AlertCircle size={16} strokeWidth={2} />
          )}
          {feedback.message}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-2xl bg-slate-100 mb-8 w-fit">
        {(["agenda", "citas"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "agenda" ? "Agenda y Disponibilidad" : "Citas Próximas"}
            {tab === "citas" && !bookingsLoading && bookings.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[rgba(192,138,94,0.15)] text-[var(--color-bronze)] text-[10px] font-semibold">
                {bookings.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1 — Agenda y Disponibilidad
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "agenda" && (
        <>
          {/* Add slot form */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-1">Abrir nuevo horario</h2>
            <p className="text-xs text-[var(--color-text-muted)] mb-5">
              Elige una fecha y hora para crear un espacio de cita visible para las pacientes.
            </p>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[220px]">
                <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                  Fecha y hora
                </label>
                <input
                  type="datetime-local"
                  value={newDateTime}
                  onChange={(e) => setNewDateTime(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
                />
              </div>
              <button
                onClick={addSlot}
                disabled={!newDateTime || adding}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-bronze)] hover:bg-[var(--color-bronze-hover)] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Añadiendo…
                  </>
                ) : (
                  <>
                    <Plus size={15} strokeWidth={2.5} />
                    Añadir horario
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Slots list */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-50">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                Horarios disponibles
                {!slotsLoading && (
                  <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[rgba(192,138,94,0.12)] text-[var(--color-bronze)] text-[11px] font-medium">
                    {slots.length}
                  </span>
                )}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Horarios que las pacientes pueden reservar. Usa{" "}
                <Trash2 size={11} strokeWidth={2} className="inline mb-0.5" />{" "}
                para cancelar un hueco antes de que lo reserve alguien.
              </p>
            </div>

            {slotsLoading ? (
              <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Cargando…</div>
            ) : slots.length === 0 ? (
              <div className="p-12 flex flex-col items-center text-center">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(192,138,94,0.08)]">
                  <CalendarDays size={24} className="text-[var(--color-bronze)]" strokeWidth={1.5} />
                </div>
                <p className="mb-1 text-sm font-medium text-slate-700">Sin horarios abiertos</p>
                <p className="max-w-xs text-xs leading-relaxed text-[var(--color-text-muted)]">
                  Usa el formulario de arriba para abrir nuevos espacios de cita.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 border-b border-slate-100 bg-slate-50 px-6 py-3 text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  <span>Fecha</span>
                  <span>Hora</span>
                  <span />
                </div>
                {slots.map((slot, idx) => {
                  const { date: dateStr, time: timeStr } = formatSlotTime(slot.start_time);
                  return (
                    <div
                      key={slot.id}
                      className={`grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] items-center gap-3 sm:gap-4 px-6 py-4 ${
                        idx !== slots.length - 1 ? "border-b border-slate-50" : ""
                      }`}
                    >
                      <p className="text-sm font-medium capitalize text-slate-800">{dateStr}</p>
                      <span className="inline-flex items-center rounded-full bg-[rgba(192,138,94,0.10)] px-2.5 py-1 text-xs font-medium text-[var(--color-bronze)]">
                        {timeStr}
                      </span>
                      <button
                        onClick={() => deleteSlot(slot.id)}
                        aria-label="Eliminar horario"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={15} strokeWidth={1.75} />
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2 — Citas Próximas
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "citas" && (
        <>
          {/* Toolbar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[200px] flex-1">
              <Search
                size={14}
                strokeWidth={1.75}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Buscar por nombre de paciente…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-700 placeholder:text-slate-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Nueva cita manual */}
            <button
              onClick={() => setShowManualForm(true)}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-[var(--color-bronze)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-bronze-hover)]"
            >
              <Plus size={15} strokeWidth={2.5} />
              Nueva Cita Manual
            </button>
          </div>

          {/* Bookings list */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
            {bookingsLoading ? (
              <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Cargando…</div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-12 flex flex-col items-center text-center">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(192,138,94,0.08)]">
                  <CalendarDays size={24} className="text-[var(--color-bronze)]" strokeWidth={1.5} />
                </div>
                <p className="mb-1 text-sm font-medium text-slate-700">
                  {search ? "Sin resultados" : "No hay citas"}
                </p>
                <p className="max-w-xs text-xs leading-relaxed text-[var(--color-text-muted)]">
                  {search
                    ? `No se encontraron citas para "${search}".`
                    : "Las reservas de las pacientes aparecerán aquí."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table header */}
                <div className="hidden lg:grid grid-cols-[88px_1fr_160px_36px_108px_auto] items-center gap-4 border-b border-slate-100 bg-slate-50 px-6 py-3 text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  <span>Fecha</span>
                  <span>Paciente</span>
                  <span>Servicio</span>
                  <span>WA</span>
                  <span>Estado</span>
                  <span>Acciones</span>
                </div>

                {filteredBookings.map((booking, idx) => {
                  const svcName =
                    SERVICES.find((s) => s.id === booking.service_id)?.es.name ??
                    booking.service_id;
                  return (
                    <div
                      key={booking.id}
                      className={`flex flex-col lg:grid lg:grid-cols-[88px_1fr_160px_36px_108px_auto] lg:items-center gap-3 lg:gap-4 px-6 py-5 ${
                        idx !== filteredBookings.length - 1 ? "border-b border-slate-50" : ""
                      }`}
                    >
                      {/* Date + time */}
                      <div className="shrink-0">
                        <p className="text-sm font-semibold capitalize text-slate-800">
                          {formatBookingDate(booking.date)}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">{booking.time} h</p>
                      </div>

                      {/* Patient */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {booking.patient_name}
                          </p>
                          {booking.is_manual && (
                            <span className="shrink-0 rounded-full bg-[rgba(192,138,94,0.10)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-medium text-[var(--color-bronze)]">
                              Manual
                            </span>
                          )}
                        </div>
                        {booking.patient_email && (
                          <p className="truncate text-xs text-[var(--color-text-muted)]">
                            {booking.patient_email}
                          </p>
                        )}
                        {booking.notes && (
                          <p className="mt-0.5 truncate text-xs italic text-slate-400 lg:hidden">
                            {booking.notes}
                          </p>
                        )}
                      </div>

                      {/* Service */}
                      <p className="truncate text-sm text-slate-600 hidden lg:block">{svcName}</p>

                      {/* WhatsApp */}
                      <div>
                        {booking.patient_phone ? (
                          <a
                            href={buildPatientWhatsAppUrl(booking.patient_phone, {
                              patientName: booking.patient_name,
                              serviceName: svcName,
                              date:        booking.date,
                              time:        booking.time,
                              bookingRef:  booking.booking_ref,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Enviar WhatsApp"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366] transition-colors hover:bg-[#25D366]/20"
                          >
                            <MessageCircle size={15} strokeWidth={1.75} />
                          </a>
                        ) : (
                          <span className="inline-flex h-8 w-8 items-center justify-center text-slate-200">
                            <MessageCircle size={15} strokeWidth={1.75} />
                          </span>
                        )}
                      </div>

                      {/* Status */}
                      <StatusBadge status={booking.status ?? "confirmed"} />

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {(!booking.status || booking.status === "confirmed") && (
                          <>
                            <button
                              onClick={() => updateBookingStatus(booking.id, "completed")}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                            >
                              <Check size={11} strokeWidth={2.5} />
                              Completada
                            </button>
                            <button
                              onClick={() => updateBookingStatus(booking.id, "cancelled")}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <X size={11} strokeWidth={2.5} />
                              Cancelar
                            </button>
                          </>
                        )}
                        {booking.status === "completed" && (
                          <span className="text-xs italic text-slate-400">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Count footer */}
          {!bookingsLoading && filteredBookings.length > 0 && (
            <p className="mt-4 text-right text-xs text-[var(--color-text-muted)]">
              {filteredBookings.length} {filteredBookings.length === 1 ? "cita" : "citas"}
              {search && ` · buscando "${search}"`}
            </p>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL — Nueva Cita Manual
      ══════════════════════════════════════════════════════════════ */}
      {showManualForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowManualForm(false);
              resetManualForm();
            }
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-base font-semibold text-slate-800">Nueva Cita Manual</h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  Asignar un horario disponible a una paciente.
                </p>
              </div>
              <button
                onClick={() => { setShowManualForm(false); resetManualForm(); }}
                className="ml-4 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
              {/* Slot picker */}
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                  Horario <span className="normal-case text-red-400">*</span>
                </label>
                {slots.length === 0 ? (
                  <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
                    No hay horarios disponibles. Añade uno en la pestaña{" "}
                    <button
                      className="underline underline-offset-2"
                      onClick={() => { setShowManualForm(false); setActiveTab("agenda"); }}
                    >
                      Agenda y Disponibilidad
                    </button>
                    .
                  </p>
                ) : (
                  <select
                    value={manualSlotId}
                    onChange={(e) => setManualSlotId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)]"
                  >
                    <option value="">— Selecciona un horario —</option>
                    {slots.map((s) => {
                      const d     = new Date(s.start_time);
                      const label = d.toLocaleString("es-MX", {
                        weekday: "short", day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit", hour12: false,
                      });
                      return <option key={s.id} value={s.id}>{label}</option>;
                    })}
                  </select>
                )}
              </div>

              {/* Service */}
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                  Servicio
                </label>
                <select
                  value={manualService}
                  onChange={(e) => setManualService(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)]"
                >
                  {SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>{s.es.name}</option>
                  ))}
                </select>
              </div>

              {/* Name — patient typeahead combobox */}
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                  Nombre <span className="normal-case text-red-400">*</span>
                </label>
                <div className="relative">
                  {selectedPatient ? (
                    /* Known patient — locked row with clear button */
                    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-bronze)] bg-[rgba(192,138,94,0.05)] px-3 py-2.5">
                      <span className="flex-1 text-sm font-medium text-slate-800">
                        {selectedPatient.full_name}
                      </span>
                      <span className="shrink-0 rounded-full bg-[rgba(192,138,94,0.15)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-bronze)]">
                        Conocida
                      </span>
                      <button
                        type="button"
                        onClick={clearSelectedPatient}
                        aria-label="Limpiar selección"
                        className="shrink-0 text-slate-400 transition-colors hover:text-slate-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    /* Free-type input with live dropdown */
                    <>
                      <input
                        type="text"
                        autoComplete="off"
                        value={manualName}
                        onChange={(e) => {
                          setManualName(e.target.value);
                          setShowPatientDropdown(true);
                        }}
                        onFocus={() => {
                          if (manualName.trim()) setShowPatientDropdown(true);
                        }}
                        onBlur={() =>
                          setTimeout(() => setShowPatientDropdown(false), 150)
                        }
                        placeholder="Escribe para buscar o añadir paciente…"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)]"
                      />
                      {showPatientDropdown && filteredPatients.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-xl">
                          {filteredPatients.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectPatient(p)}
                              className="w-full px-4 py-3 text-left transition-colors hover:bg-[rgba(192,138,94,0.06)] first:rounded-t-2xl last:rounded-b-2xl"
                            >
                              <p className="text-sm font-medium text-slate-800">{p.full_name}</p>
                              <p className="text-xs text-[var(--color-text-muted)]">
                                {p.phone ?? "—"}{p.email ? ` · ${p.email}` : ""}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                    Email{" "}
                    <span className="normal-case font-normal text-slate-300">(opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="hola@ejemplo.mx"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] ${
                      selectedPatient && manualEmail
                        ? "border-[var(--color-bronze)]/40 bg-[rgba(192,138,94,0.04)]"
                        : "border-slate-200 bg-white"
                    }`}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                    Teléfono{" "}
                    <span className="normal-case font-normal text-slate-300">(opcional)</span>
                  </label>
                  <input
                    type="tel"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="+52 664…"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] ${
                      selectedPatient && manualPhone
                        ? "border-[var(--color-bronze)]/40 bg-[rgba(192,138,94,0.04)]"
                        : "border-slate-200 bg-white"
                    }`}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                  Notas{" "}
                  <span className="normal-case font-normal text-slate-300">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Motivo de consulta, indicaciones especiales…"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)]"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                onClick={() => { setShowManualForm(false); resetManualForm(); }}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-600 transition-colors hover:bg-white"
              >
                Cancelar
              </button>
              <button
                onClick={saveManualBooking}
                disabled={!manualSlotId || !manualName.trim() || savingManual}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-bronze)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-bronze-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingManual ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <ChevronRight size={15} strokeWidth={2.5} />
                    Guardar cita
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
