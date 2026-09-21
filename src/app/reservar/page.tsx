"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Calendar, Clock, ArrowRight, MapPin, MessageCircle, AlertCircle } from "lucide-react";
import { mapDbService, type DbService, type Service } from "@/data/services";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { useClinicSettings } from "@/context/ClinicSettingsContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatPrice, type Currency } from "@/lib/format";
import { BookingCalendar, type PickedSlot } from "@/components/ui/BookingCalendar";

const UNAVAILABLE_SERVICE_NOTE = {
  es: "El servicio de tu enlace ya no está disponible para reservar. Elige otra sesión de la lista.",
  en: "The service from your link is no longer available to book. Please choose another session from the list.",
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
// This message is composed on the PATIENT's phone and sent BY them, so it
// goes out in whichever language they booked in — unlike the internal
// notification email (handleConfirm, below), which always goes to Katya in
// Spanish regardless of the patient's own language.
function buildWhatsAppUrl(
  whatsappNumber: string,
  lang: "es" | "en",
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
  const formattedDate = p.date.toLocaleDateString(lang === "es" ? "es-MX" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const msgEs = [
    "Hola, acabo de agendar una cita \uD83C\uDF3F",
    "",
    `Ref: ${p.bookingId}`,
    `Paciente: ${p.patientName}`,
    `Servicio: ${p.serviceName} (${p.duration}\u00a0min \u00b7 ${formatPrice(p.price, p.currency)})`,
    `Fecha: ${formattedDate} a las ${p.time}\u00a0h`,
  ].join("\n");
  const msgEn = [
    "Hi, I just booked a session \ud83c\udf3f",
    "",
    `Ref: ${p.bookingId}`,
    `Patient: ${p.patientName}`,
    `Service: ${p.serviceName} (${p.duration}\u00a0min \u00b7 ${formatPrice(p.price, p.currency)})`,
    `Date: ${formattedDate} at ${p.time}`,
  ].join("\n");
  const msg = lang === "es" ? msgEs : msgEn;
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}
// ── Page ──────────────────────────────────────────────────────────────────
// useSearchParams() requires a Suspense boundary at the page root — see the
// default export below.
function ReservarPageContent() {
  const searchParams = useSearchParams();
  const [step,      setStep]      = useState(1);
  const [services,  setServices]  = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [serviceId, setServiceId] = useState("");
  const [requestedServiceUnavailable, setRequestedServiceUnavailable] = useState(false);
  const [date,      setDate]      = useState<Date | null>(null);
  const [time,      setTime]      = useState<string | null>(null);
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [notes,     setNotes]     = useState("");
  const [bookingId, setBookingId] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // The picked slot, straight from BookingCalendar — its startIso is the
  // authoritative value handed to confirm_booking; displayDate/displayTime
  // are Tijuana wall-clock, safe for the browser-local display code below.
  const [selectedSlot, setSelectedSlot] = useState<PickedSlot | null>(null);

  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError,   setCancelError]   = useState<string | null>(null);
  const [cancelled,     setCancelled]     = useState(false);

  // A slot from a different service must never reach step 3 — clear the
  // pick whenever the chosen service changes. BookingCalendar re-fetches
  // per service internally.
  useEffect(() => {
    const reset = () => {
      setDate(null);
      setTime(null);
      setSelectedSlot(null);
    };
    reset();
  }, [serviceId]);

  // Single source of truth for the catalog — same "services" table the
  // /servicios page reads from, so booking step 1 never drifts out of sync
  // with the public catalog. Filtering on is_active here is also what makes
  // a hidden service impossible to book: even if a stale/hand-crafted link
  // carries its id in the URL (?service=<id>), that id is only ever honored
  // below if it appears in this active-only result set. An inactive or
  // unknown id does NOT fall back to preselecting some other service —
  // nothing is selected, so the patient sees the full list plus a note
  // explaining why their link didn't preselect anything, and has to choose
  // explicitly.
  useEffect(() => {
    const loadServices = async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, title_es, title_en, subtitle_es, subtitle_en, description_es, description_en, duration_minutes, price, tone")
        .eq("is_active", true)
        .order("created_at");
      if (error) console.error("Error fetching services:", error);
      const mapped = (data ?? []).map((row) => mapDbService(row as DbService));
      setServices(mapped);

      const requestedId = searchParams.get("service");
      if (requestedId == null) {
        setServiceId((prev) => prev || mapped[0]?.id || "");
      } else if (mapped.some((s) => s.id === requestedId)) {
        setServiceId(requestedId);
      } else {
        setServiceId("");
        setRequestedServiceUnavailable(true);
      }
      setServicesLoading(false);
    };
    loadServices();
  }, [searchParams]);

  const { settings: clinicInfo, bookingSettings } = useClinicSettings();
  const { lang } = useLanguage();
  const currency = clinicInfo.currency;
  const svc = services.find((s) => s.id === serviceId);
  // Service name/tagline/description in whichever language the visitor is
  // browsing in — mapDbService() already falls back to Spanish when the
  // English field is empty, so this is safe even for services that only
  // have a Spanish translation filled in.
  const svcCopy = svc ? (lang === "es" ? svc.es : svc.en) : null;

  // Generate an .ics file in-memory and trigger download.
  // RFC 5545 minimal — works with Apple Calendar, Google, Outlook.
  const downloadIcs = () => {
    if (!date || !time || !svc || !svcCopy) return;
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
      `SUMMARY:${svcCopy.name} · Katya Heras Clínica`,
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

  // Submit booking via the confirm_booking RPC (see
  // 0032_confirm_booking_rpc.sql) — a single atomic transaction that
  // re-checks availability, inserts the booking, and clears every
  // now-overlapping available_slots row (across all services), instead of
  // the old two-step "insert, then best-effort mark this one slot taken".
  // The confirmation ref is never generated client-side — it's only ever
  // the one confirm_booking returns on success.
  //
  // p_slot_start is the exact start_time ISO string from the picked slot
  // (selectedSlot.startIso), not a client-rebuilt Date from `date` + `time`
  // — those two are display strings derived from BookingCalendar's Tijuana
  // conversion and are only ever used for on-screen display downstream.
  const handleConfirm = async () => {
    if (!selectedSlot || !date || !time || !name.trim() || !email.trim() || !phone.trim() || !svc) return;
    const activeSvc = svc;

    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc("confirm_booking", {
      p_service_id:    serviceId,
      p_slot_start:    selectedSlot.startIso,
      p_patient_name:  name.trim(),
      p_patient_email: email.trim(),
      p_patient_phone: phone.trim(),
      p_notes:         notes.trim() || null,
    });

    const result = data?.[0] as
      | { success: boolean; booking_id: string | null; booking_ref: string | null; error_code: string | null }
      | undefined;

    if (rpcError || !result?.success) {
      setLoading(false);
      console.error("confirm_booking error:", rpcError?.message, result?.error_code);
      if (
        result?.error_code === "slot_taken" ||
        result?.error_code === "slot_blocked" ||
        result?.error_code === "slot_unavailable"
      ) {
        // The picked slot is gone (raced by someone else, blocked, or stale
        // because the nightly regeneration didn't run) — staying on step 3
        // with the same selection would just fail the same way again if the
        // patient hits Confirmar a second time. Clear it and send them back
        // to the calendar, which remounts fresh (BookingCalendar re-queries
        // available_slots on mount) so the stale slot can't be re-offered.
        setSelectedSlot(null);
        setDate(null);
        setTime(null);
        setError(
          lang === "es"
            ? "Ese horario acaba de ocuparse. Elige otro."
            : "That time slot was just taken. Please pick another."
        );
        setStep(2);
      } else {
        setError(
          `No pudimos confirmar tu reserva. Por favor intenta de nuevo o llámanos al ${clinicInfo.whatsapp_number}.`
        );
      }
      return;
    }

    setLoading(false);

    // Fire-and-forget internal notification — the booking is already
    // confirmed in the DB. We intentionally do NOT await this: the patient
    // sees the success screen immediately. If the email fails, it logs
    // server-side but never surfaces an error to the patient.
    //
    // service is deliberately activeSvc.es.name, not lang-aware: this email
    // goes to the clinic (Katya), whose entire template (route.ts) is
    // hardcoded Spanish regardless of the patient's browsing language.
    fetch("/api/send-booking-notification", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientName:  name.trim(),
        patientEmail: email.trim(),
        patientPhone: phone.trim(),
        service:      activeSvc.es.name,
        date:         date.toISOString().split("T")[0],
        time,
        bookingRef:   result.booking_ref,
        clinicEmail:  clinicInfo.contact_email,
        notes:        notes.trim() || undefined,
      }),
    }).catch((err: unknown) => {
      // Non-critical — booking is already confirmed in the DB.
      console.warn("[booking] Notification email failed:", err);
    });

    // Fire-and-forget patient confirmation — sent in whichever language they
    // booked in (unlike the clinic notification above). Same reasoning: a
    // failed send must never undo or block an already-successful booking,
    // so this is never awaited and its own route always responds 200 even
    // on failure, logging server-side instead.
    fetch("/api/send-patient-confirmation", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lang,
        patientEmail:    email.trim(),
        patientName:     name.trim(),
        serviceName:     svcCopy?.name ?? activeSvc.es.name,
        durationMinutes: activeSvc.duration,
        priceLabel:      formatPrice(Number(activeSvc.price.replace(/,/g, "")), currency),
        startIso:        selectedSlot.startIso,
        bookingRef:      result.booking_ref,
        address:         clinicInfo.physical_address,
        mapsUrl:
          clinicInfo.maps_url.trim() ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicInfo.physical_address)}`,
        whatToBring:     clinicInfo.instructions_pre_appointment,
        whatsappNumber:  clinicInfo.whatsapp_number,
      }),
    }).catch((err: unknown) => {
      // Non-critical — booking is already confirmed in the DB.
      console.warn("[booking] Patient confirmation email failed:", err);
    });

    // Only reach here on confirmed DB success — safe to show the ref.
    setBookingId(result.booking_ref ?? "");
    setStep(4);
  };

  const handleModify = () => {
    setDate(null);
    setTime(null);
    setSelectedSlot(null);
    setBookingId("");
    setCancelled(false);
    setCancelConfirm(false);
    setStep(2);
  };

  const handleCancel = async () => {
    if (!bookingId) return;
    setCancelLoading(true);
    setCancelError(null);
    // cancel_booking is a security definer RPC (see
    // 0026_cancel_booking_rpc.sql) — it binds booking_ref + patient_email
    // to the same row inside the function itself, since there's no longer
    // an anon RLS policy on bookings.is_cancelled at all. It returns
    // `false` (not an error) for a wrong email, an unknown ref, or an
    // already-cancelled booking, so this can't be used to probe whether a
    // ref exists.
    const { data: cancelled, error } = await supabase.rpc("cancel_booking", {
      ref: bookingId,
      email: email.trim(),
    });
    setCancelLoading(false);
    if (error || !cancelled) {
      if (error) console.error("Cancel booking error:", error);
      setCancelError("No se pudo cancelar. Contáctanos directamente.");
      return;
    }
    setCancelled(true);
    setCancelConfirm(false);
  };

  return (
    <div className="pb-0 pt-[72px]">
      <div className="mx-auto max-w-[920px] px-5 md:px-8">

        {/* Page header */}
        <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)]">
          {lang === "es" ? "Reservar" : "Book"}
        </p>
        <h1 className="mb-8 md:mb-14 font-serif text-[clamp(2.5rem,4vw,3.5rem)] font-light leading-[1.05] tracking-[-0.01em] text-[var(--color-text)]">
          {lang === "es" ? "Tres pasos. Sin prisas." : "Three steps. No rush."}
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
          <StepIndicator n="1" label={lang === "es" ? "Servicio" : "Service"}     active={step === 1} done={step > 1} />
          <StepIndicator n="2" label={lang === "es" ? "Fecha y hora" : "Date & time"} active={step === 2} done={step > 2} />
          <StepIndicator n="3" label={lang === "es" ? "Tus datos" : "Your details"}    active={step === 3} done={step > 3} />
          <StepIndicator n="4" label={lang === "es" ? "Listo" : "Done"}        active={step === 4} done={false} />
        </div>

        {/* ── Step 1: Service selector ─────────────────────────────── */}
        {step === 1 && (
          <div className="rounded-2xl bg-[var(--color-background)] p-6 md:p-10 shadow-[var(--shadow-sm)]">
            <h2 className="mb-6 font-serif text-[24px] font-normal text-[var(--color-text)]">
              Elige un servicio
            </h2>
            {requestedServiceUnavailable && (
              <div className="mb-6 flex items-start gap-3 rounded-xl bg-[var(--color-surface-pink)] px-5 py-4">
                <AlertCircle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[var(--color-bronze)]" />
                <p className="text-[13px] leading-[1.6] text-[var(--color-text)]">
                  {UNAVAILABLE_SERVICE_NOTE[lang]}
                </p>
              </div>
            )}
            {servicesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-[70px] animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="rounded-xl bg-[var(--color-background-soft)] p-8 text-center">
                <p className="text-[14px] text-[var(--color-text-muted)]">
                  No hay servicios disponibles en este momento.{" "}
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
              <div className="flex flex-col gap-3">
                {services.map((s) => {
                  const sel = serviceId === s.id;
                  const sCopy = lang === "es" ? s.es : s.en;
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
                          {sCopy.name}
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
            )}
            <div className="mt-8 flex justify-end">
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                disabled={!svc}
                icon={<ArrowRight size={14} strokeWidth={1.5} />}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Date & time ──────────────────────────────────── */}
        {step === 2 && svc && (
          <div className="rounded-2xl bg-[var(--color-background)] p-5 md:p-10 shadow-[var(--shadow-sm)]">
            <h2 className="mb-1 font-serif text-[20px] md:text-[24px] font-normal text-[var(--color-text)]">
              {lang === "es" ? "Elige fecha y hora" : "Choose a date and time"}
            </h2>
            <p className="mb-4 text-[13px] text-[var(--color-text-muted)]">
              {svcCopy?.name} · {svc.duration} min
            </p>

            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-xl bg-[var(--color-surface-pink)] px-5 py-4">
                <AlertCircle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[var(--color-bronze)]" />
                <p className="text-[13px] leading-[1.6] text-[var(--color-text)]">{error}</p>
              </div>
            )}

            <BookingCalendar
              serviceId={serviceId}
              selectedSlotId={selectedSlot?.id ?? null}
              onSelectSlot={(slot) => {
                setError(null);
                setDate(slot.displayDate);
                setTime(slot.displayTime);
                setSelectedSlot(slot);
              }}
            />

            <div className="mt-6 flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>
                {lang === "es" ? "Volver" : "Back"}
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(3)}
                disabled={!selectedSlot}
                icon={<ArrowRight size={14} strokeWidth={1.5} />}
              >
                {lang === "es" ? "Continuar" : "Continue"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Contact details ──────────────────────────────── */}
        {step === 3 && svc && (
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
                  {svcCopy?.name}
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
        {step === 4 && svc && (
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
                {lang === "es" ? (
                  <>
                    Tu referencia es{" "}
                    <strong className="font-medium text-[var(--color-text)]">{bookingId}</strong>.
                    Katya te confirmará por WhatsApp o por teléfono.
                  </>
                ) : (
                  <>
                    Your reference is{" "}
                    <strong className="font-medium text-[var(--color-text)]">{bookingId}</strong>.
                    Katya will confirm by WhatsApp or by phone.
                  </>
                )}
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
                    {svcCopy?.name}
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
                    href={
                      clinicInfo.maps_url.trim() ||
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicInfo.physical_address)}`
                    }
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
                    // Sent in the patient's own language (lang) — this
                    // message is composed on their phone, unlike the
                    // internal notification email which always goes to
                    // Katya in Spanish.
                    <a
                      href={buildWhatsAppUrl(clinicInfo.whatsapp_number, lang, {
                        bookingId,
                        patientName: name,
                        serviceName: svcCopy?.name ?? "",
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

export default function ReservarPage() {
  return (
    <Suspense fallback={null}>
      <ReservarPageContent />
    </Suspense>
  );
}
