"use client";

import { useState, useEffect } from "react";
import { Check, Calendar, Clock, ArrowRight, MapPin, MessageCircle } from "lucide-react";
import { SERVICES } from "@/data/services";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { useClinicSettings } from "@/context/ClinicSettingsContext";
import { formatPrice, type Currency } from "@/lib/format";

// ── Availability types ────────────────────────────────────────────────────
type AvailableSlot = {
  id: string;
  service_id: string | null;
  start_time: string; // ISO timestamptz from Supabase
};

// ── Step indicator ────────────────────────────────────────────────────────
function StepIndicator({
  n,
  label,
  active,
  done,
}: {
  n: string;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 transition-opacity duration-400 ${active || done ? "opacity-100" : "opacity-50"}`}>
      <div
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-serif text-[13px] transition-all duration-400 ${
          done
            ? "bg-[var(--color-bronze)] text-white"
            : active
            ? "border border-[var(--color-bronze)] bg-[var(--color-surface-pink)] text-[var(--color-text)]"
            : "border border-[rgba(30,41,59,0.15)] bg-transparent text-[var(--color-text)]"
        }`}
      >
        {done ? <Check size={14} strokeWidth={1.5} /> : n}
      </div>
      <span
        className={`text-[13px] text-[var(--color-text)] ${active ? "font-medium" : "font-normal"}`}
      >
        {label}
      </span>
    </div>
  );
}

// ── Shared input class ────────────────────────────────────────────────────
const fieldCls =
  "w-full rounded-xl border border-[rgba(30,41,59,0.12)] bg-[var(--color-background)] px-4 py-3 font-sans text-[15px] text-[var(--color-text)] transition-colors focus:border-[var(--color-bronze)] focus:outline-none";
// ── WhatsApp deep-link builder ───────────────────────────────────────────────
function buildWhatsAppUrl(
  whatsappNumber: string,
  p: {
    bookingId: string;
    patientName: string;
    serviceName: string;
    duration: number;
    price: number;
    currency: Currency;
    date: Date;
    time: string;
  }
): string {
  // Strip everything that isn’t a digit — wa.me expects pure digits in intl format
  const clean = whatsappNumber.replace(/\D/g, "");
  const formattedDate = p.date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const msg = [
    "Hola, acabo de agendar una cita \uD83C\uDF3F",
    "",
    `Ref: ${p.bookingId}`,
    `Paciente: ${p.patientName}`,
    `Servicio: ${p.serviceName} (${p.duration}\u00a0min \u00b7 ${formatPrice(p.price, p.currency)})`,
    `Fecha: ${formattedDate} a las ${p.time}\u00a0h`,
  ].join("\n");
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}
// ── Page ──────────────────────────────────────────────────────────────────
export default function ReservarPage() {
  const [step,      setStep]      = useState(1);
  const [serviceId, setServiceId] = useState("estructural");
  const [date,      setDate]      = useState<Date | null>(null);
  const [time,      setTime]      = useState<string | null>(null);
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [notes,     setNotes]     = useState("");
  const [bookingId, setBookingId] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // ── Availability from Supabase (whitelist) ─────────────────────────────
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading,   setSlotsLoading]   = useState(true);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError,   setCancelError]   = useState<string | null>(null);
  const [cancelled,     setCancelled]     = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("available_slots")
        .select("id, service_id, start_time")
        .eq("is_booked", false)
        .gt("start_time", new Date().toISOString())
        .order("start_time");
      if (error) console.error("Error fetching available slots:", error);
      setAvailableSlots(data ?? []);
      setSlotsLoading(false);
    };
    load();
  }, []);

  const { settings: clinicInfo, bookingSettings } = useClinicSettings();
  const currency = clinicInfo.currency;
  const svc = SERVICES.find((s) => s.id === serviceId)!;

  // ── Availability helpers ────────────────────────────────────────────────
  const toIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Generate an .ics file in-memory and trigger download.
  // RFC 5545 minimal — works with Apple Calendar, Google, Outlook.
  const downloadIcs = () => {
    if (!date || !time || !svc) return;
    const [hh, mm] = time.split(":").map(Number);
    const start    = new Date(date);
    start.setHours(hh, mm, 0, 0);
    const end      = new Date(start);
    end.setMinutes(end.getMinutes() + svc.duration);
    const fmt      = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Katya Heras Clinica//Booking//ES",
      "BEGIN:VEVENT",
      `UID:${bookingId || "kh"}-${Date.now()}@katyaheras.mx`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${svc.es.name} · Katya Heras Clínica`,
      `LOCATION:${clinicInfo.physical_address.replace(/,/g, "\\,")}`,
      `DESCRIPTION:Sesión confirmada — ${bookingId}. Llega 5 min antes. Política de cancelación 24h.`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${bookingId || "cita"}-katya-heras.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Submit booking to Supabase and advance to confirmation step.
  // The confirmation ID is derived exclusively from the UUID that Supabase
  // assigns — it is never generated or shown until the insert succeeds.
  const handleConfirm = async () => {
    if (!date || !time || !name.trim() || !email.trim() || !phone.trim()) return;

    setLoading(true);
    setError(null);

    // Generate a display-only confirmation ref (shown to patient after DB success).
    const yr  = new Date().getFullYear();
    const ref = `KH-${yr}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const { error: dbError } = await supabase
      .from("bookings")
      .insert({
        service_id:    serviceId,
        date:          date.toISOString().split("T")[0],
        time,
        patient_name:  name.trim(),
        patient_email: email.trim(),
        patient_phone: phone.trim(),
        notes:         notes.trim() || null,
        booking_ref:   ref,
      });

    if (dbError) {
      setLoading(false);
      console.error("Supabase INSERT error:", dbError.code, dbError.message, dbError.details, dbError.hint);
      setError(
        `No pudimos confirmar tu reserva. Por favor intenta de nuevo o llámanos al ${clinicInfo.whatsapp_number}.`
      );
      return;
    }

    // Mark the selected slot as taken so it no longer shows to other visitors.
    // Best-effort: the booking is already confirmed in the DB regardless.
    if (selectedSlotId) {
      const { error: slotError } = await supabase
        .from("available_slots")
        .update({ is_booked: true })
        .eq("id", selectedSlotId);
      if (slotError) console.warn("[booking] Could not mark slot as booked:", slotError);
    }

    setLoading(false);

    // Fire-and-forget internal notification — DB insert already succeeded.
    // We intentionally do NOT await this: the patient sees the success screen
    // immediately. If the email fails, it logs server-side but never surfaces
    // an error to the patient.
    fetch("/api/send-booking-notification", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientName:  name.trim(),
        patientEmail: email.trim(),
        patientPhone: phone.trim(),
        service:      svc.es.name,
        date:         date.toISOString().split("T")[0],
        time,
        bookingRef:   ref,
        clinicEmail:  clinicInfo.contact_email,
        notes:        notes.trim() || undefined,
      }),
    }).catch((err: unknown) => {
      // Non-critical — booking is already confirmed in the DB.
      console.warn("[booking] Notification email failed:", err);
    });

    // Only reach here on confirmed DB success — safe to show the ref.
    setBookingId(ref);
    setStep(4);
  };

  const handleModify = () => {
    setDate(null);
    setTime(null);
    setSelectedSlotId(null);
    setBookingId("");
    setCancelled(false);
    setCancelConfirm(false);
    setStep(2);
  };

  const handleCancel = async () => {
    if (!bookingId) return;
    setCancelLoading(true);
    setCancelError(null);
    const { error } = await supabase
      .from("bookings")
      .update({ is_cancelled: true })
      .eq("booking_ref", bookingId)
      .eq("patient_email", email.trim());
    setCancelLoading(false);
    if (error) {
      console.error("Cancel booking error:", error);
      setCancelError("No se pudo cancelar. Contáctanos directamente.");
      return;
    }
    setCancelled(true);
    setCancelConfirm(false);
  };

  // ── Build calendar data from whitelist ───────────────────────────────
  type SlotDay = { isoDate: string; date: Date; slots: { id: string; time: string }[] };
  const slotsByDate = new Map<string, SlotDay>();
  availableSlots.forEach((slot) => {
    const d       = new Date(slot.start_time);
    const isoDate = toIso(d);
    const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    if (!slotsByDate.has(isoDate)) {
      const dayDate = new Date(d);
      dayDate.setHours(0, 0, 0, 0);
      slotsByDate.set(isoDate, { isoDate, date: dayDate, slots: [] });
    }
    slotsByDate.get(isoDate)!.slots.push({ id: slot.id, time: timeStr });
  });

  const availableDays = Array.from(slotsByDate.values()).sort((a, b) =>
    a.isoDate.localeCompare(b.isoDate)
  );

  // ── Shared time-slot button class builder
  const timeSlotCls = (selected: boolean) =>
    `cursor-pointer rounded-full border px-[22px] py-2.5 font-sans text-[14px] transition-all duration-300 ${
      selected
        ? "border-[var(--color-bronze)] bg-[var(--color-bronze)] text-white"
        : "border-[rgba(30,41,59,0.15)] bg-[var(--color-background)] text-[var(--color-text)] hover:border-[var(--color-bronze)]"
    }`;

  const selectedIso      = date ? toIso(date) : null;
  const selectedDaySlots = selectedIso ? (slotsByDate.get(selectedIso)?.slots ?? []) : [];
  const slotsAM          = selectedDaySlots.filter((s) => parseInt(s.time.split(":")[0]) < 12);
  const slotsPM          = selectedDaySlots.filter((s) => parseInt(s.time.split(":")[0]) >= 12);

  // Group available days by month for calendar headers
  type MonthGroup = { label: string; days: SlotDay[] };
  const monthGroups = availableDays.reduce<MonthGroup[]>((acc, d) => {
    const label = d.date.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    if (acc.length === 0 || acc[acc.length - 1].label !== label) {
      acc.push({ label, days: [d] });
    } else {
      acc[acc.length - 1].days.push(d);
    }
    return acc;
  }, []);

  return (
    <div className="pb-0 pt-[72px]">
      <div className="mx-auto max-w-[920px] px-5 md:px-8">

        {/* Page header */}
        <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
          Reservar
        </p>
        <h1 className="mb-8 md:mb-14 font-serif text-[clamp(2.5rem,4vw,3.5rem)] font-light leading-[1.05] tracking-[-0.01em] text-[var(--color-text)]">
          Tres pasos. Sin prisas.
        </h1>

        {/* ── Bookings disabled banner ──────────────────────────────── */}
        {!bookingSettings.is_booking_enabled ? (
          <div className="rounded-2xl bg-[var(--color-background)] p-12 text-center shadow-[var(--shadow-sm)]">
            <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-background-soft)]">
              <MessageCircle size={28} strokeWidth={1.5} className="text-[var(--color-bronze)]" />
            </div>
            <h2 className="mb-4 font-serif text-[clamp(1.8rem,3vw,2.5rem)] font-light text-[var(--color-text)]">
              Reservas temporalmente desactivadas
            </h2>
            <p className="mx-auto max-w-[480px] text-[16px] leading-[1.65] text-[var(--color-text-muted)]">
              Las reservas en línea no están disponibles en este momento. Por favor contáctanos
              directamente por{" "}
              <a
                href={`https://wa.me/${clinicInfo.whatsapp_number.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-bronze)] underline underline-offset-2 hover:text-[var(--color-bronze-hover)]"
              >
                WhatsApp
              </a>
              .
            </p>
          </div>
        ) : (
          <>
        {/* ── Stepper ──────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-wrap gap-8 rounded-2xl bg-[var(--color-background-soft)] px-5 py-4 md:px-8 md:py-6">
          <StepIndicator n="1" label="Servicio"     active={step === 1} done={step > 1} />
          <StepIndicator n="2" label="Fecha y hora" active={step === 2} done={step > 2} />
          <StepIndicator n="3" label="Tus datos"    active={step === 3} done={step > 3} />
          <StepIndicator n="4" label="Listo"        active={step === 4} done={false} />
        </div>

        {/* ── Step 1: Service selector ─────────────────────────────── */}
        {step === 1 && (
          <div className="rounded-2xl bg-[var(--color-background)] p-6 md:p-10 shadow-[var(--shadow-sm)]">
            <h2 className="mb-6 font-serif text-[24px] font-normal text-[var(--color-text)]">
              Elige un servicio
            </h2>
            <div className="flex flex-col gap-3">
              {SERVICES.map((s) => {
                const sel = serviceId === s.id;
                return (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border px-6 py-[18px] transition-all duration-300 ${
                      sel
                        ? "border-[var(--color-bronze)] bg-[rgba(192,138,94,0.08)]"
                        : "border-[rgba(30,41,59,0.08)] bg-[var(--color-background)] hover:border-[rgba(30,41,59,0.16)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="svc"
                      checked={sel}
                      onChange={() => setServiceId(s.id)}
                      className="sr-only"
                    />
                    <div>
                      <p className="mb-0.5 font-serif text-[18px] text-[var(--color-text)]">
                        {s.es.name}
                      </p>
                      <p className="text-[13px] text-[var(--color-text-muted)]">
                        {s.duration} min · {formatPrice(Number(s.price.replace(/,/g, '')), currency)}
                      </p>
                    </div>
                    <div
                      className={`inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                        sel
                          ? "border-[var(--color-bronze)] bg-[var(--color-bronze)] text-white"
                          : "border-[rgba(30,41,59,0.2)] bg-transparent"
                      }`}
                    >
                      {sel && <Check size={12} strokeWidth={2} />}
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="mt-8 flex justify-end">
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                icon={<ArrowRight size={14} strokeWidth={1.5} />}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Date & time ──────────────────────────────────── */}
        {step === 2 && (
          <div className="rounded-2xl bg-[var(--color-background)] p-6 md:p-10 shadow-[var(--shadow-sm)]">
            <h2 className="mb-2 font-serif text-[24px] font-normal text-[var(--color-text)]">
              Elige fecha y hora
            </h2>
            <p className="mb-7 text-[14px] text-[var(--color-text-muted)]">
              {svc.es.name} · {svc.duration} min
            </p>

            {/* Multi-month calendar — days sourced from whitelist */}
            {slotsLoading ? (
              <div className="mb-8 grid grid-cols-7 gap-2">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="h-[64px] rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : availableDays.length === 0 ? (
              <div className="mb-8 rounded-xl bg-[var(--color-background-soft)] p-8 text-center">
                <p className="text-[14px] text-[var(--color-text-muted)]">
                  No hay citas disponibles en este momento.{" "}
                  <a
                    href={`https://wa.me/${clinicInfo.whatsapp_number.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-bronze)] underline-offset-2 hover:underline"
                  >
                    Escríbenos por WhatsApp.
                  </a>
                </p>
              </div>
            ) : (
              <div className="mb-8 space-y-6">
                {monthGroups.map(({ label, days: monthDays }) => (
                  <div key={label}>
                    <p className="mb-3 text-xs capitalize tracking-[0.15em] text-[var(--color-bronze)]">
                      {label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {monthDays.map((slotDay, i) => {
                        const sel = !!date && slotDay.isoDate === toIso(date);
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setDate(slotDay.date);
                              setTime(null);
                              setSelectedSlotId(null);
                            }}
                            className={`flex flex-col items-center gap-0.5 rounded-xl border px-3 py-3.5 font-sans transition-all duration-300 ${
                              sel
                                ? "border-[var(--color-bronze)] bg-[var(--color-bronze)] text-white"
                                : "cursor-pointer border-[rgba(30,41,59,0.08)] bg-[var(--color-background)] text-[var(--color-text)] hover:border-[var(--color-bronze)]/50"
                            }`}
                          >
                            <span className="text-[11px] uppercase tracking-[0.08em] opacity-70">
                              {slotDay.date.toLocaleDateString("es-MX", { weekday: "short" })}
                            </span>
                            <span className="font-serif text-[20px]">{slotDay.date.getDate()}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Time slots — visible only after a date is selected */}
            {date && selectedDaySlots.length === 0 && (
              <p className="mt-2 text-[13px] italic text-[var(--color-text-muted)]">
                No hay disponibilidad para este día.
              </p>
            )}
            {date && selectedDaySlots.length > 0 && (
              <>
                {slotsAM.length > 0 && (
                  <>
                    <p className="mb-3.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
                      Mañana
                    </p>
                    <div className="mb-6 flex flex-wrap gap-2.5">
                      {slotsAM.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setTime(s.time); setSelectedSlotId(s.id); }}
                          className={timeSlotCls(time === s.time)}
                        >
                          {s.time}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {slotsPM.length > 0 && (
                  <>
                    <p className="mb-3.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
                      Tarde
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {slotsPM.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setTime(s.time); setSelectedSlotId(s.id); }}
                          className={timeSlotCls(time === s.time)}
                        >
                          {s.time}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            <div className="mt-10 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>Volver</Button>
              <Button
                variant="primary"
                onClick={() => { if (date && time) setStep(3); }}
                icon={<ArrowRight size={14} strokeWidth={1.5} />}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Contact details ──────────────────────────────── */}
        {step === 3 && (
          <div className="rounded-2xl bg-[var(--color-background)] p-6 md:p-10 shadow-[var(--shadow-sm)]">
            <h2 className="mb-7 font-serif text-[24px] font-normal text-[var(--color-text)]">
              Tus datos
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Nombre
                </label>
                <input
                  className={fieldCls}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Cómo te llamas"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Teléfono
                </label>
                <input
                  className={fieldCls}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 664 ..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Email
                </label>
                <input
                  className={fieldCls}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hola@ejemplo.mx"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Notas para la sesión
                </label>
                <textarea
                  className={fieldCls}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Cuéntanos qué te trae por aquí…"
                />
              </div>
            </div>

            {/* Booking summary */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--color-background-soft)] p-6">
              <div>
                <p className="mb-1 font-serif text-[18px] text-[var(--color-text)]">
                  {svc.es.name}
                </p>
                <div className="flex flex-wrap gap-3.5 text-[13px] text-[var(--color-text-muted)]">
                  {date && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} strokeWidth={1.5} />
                      {date.toLocaleDateString("es-MX", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  )}
                  {time && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={13} strokeWidth={1.5} />
                      {time}
                    </span>
                  )}
                </div>
              </div>
              <p className="font-serif text-[22px] text-[var(--color-text)]">
                {formatPrice(Number(svc.price.replace(/,/g, '')), currency)}
              </p>
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>Volver</Button>
              <div className="flex flex-col items-end gap-3">
                {error && (
                  <div className="flex max-w-[400px] items-start gap-3 rounded-xl bg-[var(--color-surface-pink)] px-5 py-4 text-right">
                    <p className="text-[13px] leading-[1.6] text-[var(--color-text)]">
                      {error}
                    </p>
                  </div>
                )}
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  disabled={loading || !name.trim() || !email.trim() || !phone.trim()}
                  icon={
                    loading ? (
                      <svg
                        className="animate-spin"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    ) : (
                      <ArrowRight size={14} strokeWidth={1.5} />
                    )
                  }
                >
                  {loading ? "Confirmando…" : "Confirmar reserva"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Confirmation ─────────────────────────────────── */}
        {step === 4 && (
          <div className="flex flex-col gap-5 pb-24">

            {/* Hero confirmation card */}
            <div className="rounded-2xl border border-[rgba(30,41,59,0.06)] bg-[var(--color-background)] px-10 pb-9 pt-12 text-center shadow-[var(--shadow-sm)]">
              <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-green)] text-[var(--color-bronze)]">
                <Check size={28} strokeWidth={1.5} />
              </div>
              <p className="mb-3 font-sans text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                Reserva confirmada · {bookingId}
              </p>
              <h2 className="mb-4 font-serif text-[clamp(2.25rem,3.4vw,3rem)] font-light leading-[1.1] text-[var(--color-text)]">
                Te espero.
              </h2>
              <p className="mx-auto max-w-[480px] text-[16px] leading-[1.65] text-[var(--color-text-muted)]">
                Te mandé un correo a{" "}
                <strong className="font-medium text-[var(--color-text)]">
                  {email || "tu correo"}
                </strong>{" "}
                con todos los detalles. Revisa también la carpeta de spam por si acaso.
              </p>
            </div>

            {/* Session details + map */}
            <div className="overflow-hidden rounded-2xl shadow-[var(--shadow-sm)]">

              {/* Summary row */}
              <div className="grid grid-cols-1 gap-8 border-b border-[rgba(30,41,59,0.08)] bg-[var(--color-background)] p-10 sm:grid-cols-2">
                <div>
                  <p className="mb-2.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
                    Sesión
                  </p>
                  <p className="mb-1.5 font-serif text-[22px] font-normal leading-[1.2] text-[var(--color-text)]">
                    {svc.es.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[14px] text-[var(--color-text-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={13} strokeWidth={1.5} /> {svc.duration} min
                    </span>
                    <span className="text-[rgba(30,41,59,0.2)]">·</span>
                    <span className="tabular-nums">{formatPrice(Number(svc.price.replace(/,/g, '')), currency)}</span>
                  </div>
                </div>
                <div>
                  <p className="mb-2.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
                    Fecha y hora
                  </p>
                  <p className="mb-1.5 font-serif text-[22px] font-normal leading-[1.2] text-[var(--color-text)]">
                    {date?.toLocaleDateString("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[14px] text-[var(--color-text-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} strokeWidth={1.5} /> {time} h
                    </span>
                    <span className="text-[rgba(30,41,59,0.2)]">·</span>
                    <span>Llega 5 min antes</span>
                  </div>
                </div>
              </div>

              {/* Abstract map + address */}
              <div className="grid grid-cols-1 border-b border-[rgba(30,41,59,0.08)] md:grid-cols-[1.4fr_1fr]">
                {/* Stylized no-API map */}
                <div
                  className="relative min-h-[240px] overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #EEF2F2 0%, #E1F5FE 60%, #F1E3D6 100%)",
                  }}
                >
                  <svg
                    viewBox="0 0 400 240"
                    preserveAspectRatio="xMidYMid slice"
                    className="absolute inset-0 h-full w-full opacity-55"
                  >
                    <g stroke="rgba(30,41,59,0.18)" strokeWidth="0.8" fill="none">
                      <path d="M 0 80 L 400 90" />
                      <path d="M 0 140 L 400 130" />
                      <path d="M 0 200 L 400 195" />
                      <path d="M 60 0 L 50 240" />
                      <path d="M 160 0 L 150 240" />
                      <path d="M 280 0 L 290 240" />
                      <path d="M 360 0 L 365 240" />
                    </g>
                    <ellipse cx="320" cy="60" rx="50" ry="28" fill="rgba(170,200,170,0.28)" />
                    <ellipse cx="100" cy="180" rx="42" ry="22" fill="rgba(170,200,170,0.22)" />
                  </svg>
                  {/* Bronze map pin */}
                  <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center">
                    <div
                      className="flex h-11 w-11 -rotate-45 items-center justify-center bg-[var(--color-bronze)] shadow-[0_8px_16px_rgba(192,138,94,0.4)]"
                      style={{ borderRadius: "50% 50% 50% 0" }}
                    >
                      <span className="rotate-45 font-serif text-[18px] leading-none text-white">
                        K
                      </span>
                    </div>
                    <div className="mt-2.5 rounded-full bg-white px-2.5 py-1 font-sans text-[11px] uppercase tracking-[0.08em] text-[var(--color-text)] shadow-[var(--shadow-sm)]">
                      Clínica
                    </div>
                  </div>
                </div>

                {/* Address column */}
                <div className="flex flex-col gap-3.5 bg-[var(--color-background)] p-9">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
                    Dirección
                  </p>
                  <p className="font-serif text-[18px] font-normal leading-[1.4] text-[var(--color-text)]">
                    {clinicInfo.physical_address}
                  </p>
                  <a
                    href={clinicInfo.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-[13px] tracking-[0.04em] text-[var(--color-bronze)] transition-colors hover:text-[var(--color-bronze-hover)]"
                  >
                    Abrir en Google Maps{" "}
                    <ArrowRight size={12} strokeWidth={1.5} />
                  </a>
                </div>
              </div>

              {/* Actions bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--color-background-soft)] px-8 py-6">
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="primary"
                    onClick={downloadIcs}
                    icon={<Calendar size={14} strokeWidth={1.5} />}
                  >
                    Añadir al calendario
                  </Button>
                  <Button variant="secondary" onClick={() => window.print()}>
                    Imprimir
                  </Button>
                  {date && time && (
                    <a
                      href={buildWhatsAppUrl(clinicInfo.whatsapp_number, {
                        bookingId,
                        patientName: name,
                        serviceName: svc.es.name,
                        duration: svc.duration,
                        price: Number(svc.price.replace(/,/g, '')),
                        currency,
                        date,
                        time,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#25D366] px-6 py-2.5 font-sans text-sm uppercase tracking-widest text-white shadow-sm transition-all duration-200 hover:bg-[#1DA851]"
                    >
                      <MessageCircle size={14} strokeWidth={1.5} />
                      <span>Confirmar por WhatsApp</span>
                    </a>
                  )}
                </div>
                <p className="font-sans text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
                  Confirmación ·{" "}
                  <span className="text-[var(--color-text)]">{bookingId}</span>
                </p>
              </div>
            </div>

            {/* What to bring + how to arrive */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-2xl bg-[var(--color-background)] p-8 shadow-[var(--shadow-sm)]">
                <p className="mb-3.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
                  Qué traer
                </p>
                <ul className="flex list-none flex-col gap-3 p-0 text-[14px] leading-[1.6] text-[var(--color-text)]">
                  {(clinicInfo.instructions_pre_appointment ?? "Ropa cómoda y elástica\nEstudios médicos previos si los tienes\nUna botella de agua\nDiez minutos de margen para llegar sin prisa")
                    .split("\n")
                    .filter(Boolean)
                    .map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check
                          size={14}
                          strokeWidth={1.5}
                          className="mt-0.5 shrink-0 text-[var(--color-bronze)]"
                        />
                        {item}
                      </li>
                    ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-[var(--color-background)] p-8 shadow-[var(--shadow-sm)]">
                <p className="mb-3.5 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
                  Cómo llegar relajada
                </p>
                <ul className="flex list-none flex-col gap-3 p-0 text-[14px] leading-[1.6] text-[var(--color-text-muted)]">
                  {(clinicInfo.instructions_arrival ?? "Estacionamiento gratuito en la calle paralela\nA 4 cuadras de la Línea Internacional\nCafé y té de bienvenida desde 10 min antes")
                    .split("\n")
                    .filter(Boolean)
                    .map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <MapPin
                          size={14}
                          strokeWidth={1.5}
                          className="mt-0.5 shrink-0 text-[var(--color-bronze)]"
                        />
                        {item}
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            {/* Cancellation policy */}
            <div
              className="flex flex-wrap items-center justify-between gap-5 rounded-2xl px-8 py-8"
              style={{ background: "rgba(192, 138, 94, 0.10)" }}
            >
              <div className="max-w-[520px]">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze-hover)]">
                  Política de cancelación
                </p>
                <p className="m-0 text-[14px] leading-[1.6] text-[var(--color-text)]">
                  Puedes mover o cancelar la cita hasta 24 horas antes sin costo. Después de ese
                  plazo, se cobra el 50% para liberar el bloque a otra persona.
                </p>
              </div>
              {cancelled ? (
                <p className="text-sm font-medium text-emerald-600">
                  Cita cancelada. Te esperamos en otra ocasión.
                </p>
              ) : cancelConfirm ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[13px] font-medium text-[var(--color-text)]">¿Confirmar cancelación?</p>
                  {cancelError && (
                    <p className="text-xs text-red-500">{cancelError}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={cancelLoading}
                      className="cursor-pointer rounded-full border border-red-200 bg-red-50 px-5 py-2 font-sans text-[13px] text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
                    >
                      {cancelLoading ? "Cancelando…" : "Sí, cancelar"}
                    </button>
                    <button
                      onClick={() => { setCancelConfirm(false); setCancelError(null); }}
                      className="cursor-pointer rounded-full border border-[rgba(30,41,59,0.15)] bg-white px-5 py-2 font-sans text-[13px] text-[var(--color-text)] transition-colors hover:bg-[var(--color-background-soft)]"
                    >
                      Volver
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={handleModify}
                    className="cursor-pointer rounded-full border border-[rgba(30,41,59,0.15)] bg-white px-5 py-2.5 font-sans text-[13px] text-[var(--color-text)] transition-colors hover:bg-[var(--color-background-soft)]"
                  >
                    Modificar
                  </button>
                  <button
                    onClick={() => setCancelConfirm(true)}
                    className="cursor-pointer rounded-full border border-[rgba(30,41,59,0.15)] bg-transparent px-5 py-2.5 font-sans text-[13px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* Closing poetic line */}
            <p className="mt-6 text-center font-serif text-[18px] italic leading-[1.5] text-[var(--color-bronze)]">
              "El cuerpo agradece, antes incluso de ser tocado, que alguien se haya hecho tiempo."
            </p>

          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
