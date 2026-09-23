"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CalendarDays, Plus, Trash2, Check, AlertCircle,
  MessageCircle, Search, X, ChevronRight, ChevronLeft, Mail, Loader2,
} from "lucide-react";
import { authHeaders } from "@/lib/authFetch";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { mapDbService, type DbService, type Service } from "@/data/services";

// ── Today ISO date ─────────────────────────────────────────────────────────
function getTodayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Returns the ISO YYYY-MM-DD string for any Date object. */
function dateToIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}


/** Add (or subtract) whole days from an ISO YYYY-MM-DD date string. */
function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return dateToIso(dt);
}

type RangePreset = "upcoming30" | "past30" | "thisMonth" | "nextMonth" | "all";

function rangeBoundsFor(preset: RangePreset): { from: string | null; to: string | null } {
  const today = getTodayIso();
  const now = new Date();
  if (preset === "upcoming30") return { from: today, to: addDaysIso(today, 30) };
  if (preset === "past30") return { from: addDaysIso(today, -30), to: today };
  if (preset === "thisMonth") {
    const from = dateToIso(new Date(now.getFullYear(), now.getMonth(), 1));
    const to = dateToIso(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    return { from, to };
  }
  if (preset === "nextMonth") {
    const from = dateToIso(new Date(now.getFullYear(), now.getMonth() + 1, 1));
    const to = dateToIso(new Date(now.getFullYear(), now.getMonth() + 2, 0));
    return { from, to };
  }
  return { from: null, to: null };
}

function monthHeading(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}


/**
 * Converts a "YYYY-MM-DD" + "HH:MM" pair, understood as Tijuana wall-clock
 * time, to the equivalent UTC ISO instant — independent of the admin's own
 * browser timezone. Standard two-pass timezone-offset trick: read the
 * target numbers as if they were already UTC, ask what Tijuana's wall
 * clock reads for that instant, then correct by the difference.
 */
function tijuanaWallClockToIso(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const naiveUtc = Date.UTC(y, m - 1, d, hh, mm, 0);

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Tijuana",
      hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    })
      .formatToParts(new Date(naiveUtc))
      .map((p) => [p.type, p.value])
  );
  const tijuanaReadingAsUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour), Number(parts.minute), Number(parts.second)
  );
  const offset = tijuanaReadingAsUtc - naiveUtc;

  return new Date(naiveUtc - offset).toISOString();
}

/**
 * Returns an array of (null | 1-based day number) representing a calendar grid
 * for the given year/month, starting on Sunday.
 */
function buildCalendarCells(year: number, month: number): (number | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array<null>(firstWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

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
  created_at: string;
  patient_email_sent_at?: string | null;
  patient_email_last_status?: "sent" | "failed" | null;
  patient_email_last_attempt_at?: string | null;
  patient_email_staff_resend_count?: number | null;
};

const STAFF_RESEND_MAX = 3;
const STAFF_RESEND_COOLDOWN_MS = 2.5 * 60 * 1000;

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

function formatAttemptTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleString("es-MX", {
    timeZone: "America/Tijuana",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Derive display status: prefer last_status; fall back to sent_at for older rows. */
function emailSendStatus(b: Booking): "sent" | "failed" | "never" {
  if (b.patient_email_last_status === "sent" || b.patient_email_last_status === "failed") {
    return b.patient_email_last_status;
  }
  if (b.patient_email_sent_at) return "sent";
  return "never";
}

function EmailStatusChip({ booking }: { booking: Booking }) {
  const status = emailSendStatus(booking);
  const when = formatAttemptTime(
    booking.patient_email_last_attempt_at ?? booking.patient_email_sent_at
  );
  const base =
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap";
  if (status === "sent") {
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700`} title={when ?? undefined}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Enviado{when ? ` · ${when}` : ""}
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className={`${base} bg-red-50 text-red-600`} title={when ?? undefined}>
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        Falló{when ? ` · ${when}` : ""}
      </span>
    );
  }
  return (
    <span className={`${base} bg-slate-100 text-slate-500`}>
      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
      Sin enviar
    </span>
  );
}

function staffResendBlockReason(b: Booking): string | null {
  if (!b.patient_email) return "Sin correo del paciente";
  const count = Number(b.patient_email_staff_resend_count ?? 0);
  if (count >= STAFF_RESEND_MAX) {
    return `Límite de ${STAFF_RESEND_MAX} reenvíos alcanzado`;
  }
  if (b.patient_email_last_attempt_at) {
    const elapsed = Date.now() - new Date(b.patient_email_last_attempt_at).getTime();
    if (Number.isFinite(elapsed) && elapsed < STAFF_RESEND_COOLDOWN_MS) {
      const sec = Math.ceil((STAFF_RESEND_COOLDOWN_MS - elapsed) / 1000);
      return `Espera ${sec}s para reenviar`;
    }
  }
  return null;
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function CitasPage() {
  const searchParams   = useSearchParams();
  const router         = useRouter();
  const todayFilter    = searchParams.get("filter") === "today";
  const [activeTab, setActiveTab] = useState<"agenda" | "citas">(todayFilter ? "citas" : "agenda");
  const [feedback,  setFeedback]  = useState<Feedback | null>(null);

  // Calendar state
  const [selectedDate,  setSelectedDate]  = useState<Date | null>(todayFilter ? new Date() : null);
  const [currentMonth,  setCurrentMonth]  = useState<Date>(new Date());

  const showFeedback = (fb: Feedback) => {
    setFeedback(fb);
    setTimeout(() => setFeedback(null), 4500);
  };

  // ── Agenda tab ─────────────────────────────────────────────────────────
  const [slots,        setSlots]        = useState<AdminSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [newDateTime, setNewDateTime] = useState("");
  const [adding,      setAdding]      = useState(false);

  // ── Citas tab ──────────────────────────────────────────────────────────
  const [bookings,        setBookings]        = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [resendingId,     setResendingId]     = useState<string | null>(null);
  const [confirmResend,   setConfirmResend]   = useState<Booking | null>(null);
  const [search,          setSearch]          = useState("");
  // Default list: today → +30 days. Calendar day-pick still overrides.
  const [rangePreset,     setRangePreset]     = useState<RangePreset>("upcoming30");

  // Services catalog — same "services" table /servicios and /reservar read from.
  const [services, setServices] = useState<Service[]>([]);

  // Manual booking form state — date/time are free-form (not limited to
  // available_slots), since staff routinely book outside published hours.
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDate,     setManualDate]     = useState("");
  const [manualTime,     setManualTime]     = useState("");
  const [manualService,  setManualService]  = useState("");
  const [manualName,     setManualName]     = useState("");
  const [manualEmail,    setManualEmail]    = useState("");
  const [manualPhone,    setManualPhone]    = useState("");
  const [manualNotes,    setManualNotes]    = useState("");
  const [savingManual,   setSavingManual]   = useState(false);
  const [manualError,    setManualError]    = useState<string | null>(null);

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
      .neq("status", "cancelled")
      .order("date", { ascending: true })
      .order("time", { ascending: true });
    if (error) console.error("Error fetching bookings:", error);
    setBookings(data ?? []);
    setBookingsLoading(false);
  }, []);

  const fetchPatients = useCallback(async () => {
    const { data } = await supabase
      .from("patients")
      .select("id, full_name, email, phone")
      .order("full_name");
    setPatients(data ?? []);
  }, []);

  const fetchServices = useCallback(async () => {
    const { data, error } = await supabase
      .from("services")
      .select("id, title_es, title_en, subtitle_es, subtitle_en, description_es, description_en, duration_minutes, price, tone")
      .order("created_at");
    if (error) console.error("Error fetching services:", error);
    const mapped = (data ?? []).map((row) => mapDbService(row as DbService));
    setServices(mapped);
    setManualService((prev) => prev || mapped[0]?.id || "");
  }, []);

  useEffect(() => {
    fetchSlots();
    fetchBookings();
    fetchPatients();
    fetchServices();
  }, [fetchSlots, fetchBookings, fetchPatients, fetchServices]);

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
    const booking = bookings.find((b) => b.id === id);
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

      // Fire cancellation email — non-blocking, failure is silent to the
      // user. The route looks the booking up server-side by (id,
      // booking_ref) and only sends if it finds status = 'cancelled' there
      // — passing patient/service details directly used to let the route
      // be called with forged content for any recipient.
      if (status === "cancelled" && booking) {
        try {
          await fetch("/api/send-booking-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId:  booking.id,
              bookingRef: booking.booking_ref,
              actionType: "CANCEL",
            }),
          });
        } catch (emailErr) {
          console.warn("[citas] Failed to send cancellation email:", emailErr);
        }
      }
    }
  };

  const resendPatientConfirmation = async (booking: Booking) => {
    const block = staffResendBlockReason(booking);
    if (block) {
      showFeedback({ type: "error", message: block });
      return;
    }
    setResendingId(booking.id);
    setConfirmResend(null);
    try {
      const res = await fetch("/api/admin/bookings/resend-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ bookingId: booking.id, lang: "es" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        sent?: boolean;
        message?: string;
        error?: string;
        lastStatus?: "sent" | "failed";
        lastAttemptAt?: string;
        patientEmailSentAt?: string;
        staffResendCount?: number;
      };
      if (!res.ok || !data.sent) {
        // Refresh local row fields when the API stamped a failed attempt.
        if (data.lastStatus || data.lastAttemptAt || data.staffResendCount != null) {
          setBookings((prev) =>
            prev.map((b) =>
              b.id === booking.id
                ? {
                    ...b,
                    patient_email_last_status:
                      data.lastStatus ?? b.patient_email_last_status,
                    patient_email_last_attempt_at:
                      data.lastAttemptAt ?? b.patient_email_last_attempt_at,
                    patient_email_staff_resend_count:
                      data.staffResendCount ?? b.patient_email_staff_resend_count,
                  }
                : b
            )
          );
        }
        showFeedback({
          type: "error",
          message:
            data.message ||
            (data.error === "rate_limited"
              ? "Reenvío limitado. Espera un momento o se alcanzó el máximo."
              : "No se pudo reenviar la confirmación."),
        });
        return;
      }
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? {
                ...b,
                patient_email_sent_at:
                  data.patientEmailSentAt ?? data.lastAttemptAt ?? b.patient_email_sent_at,
                patient_email_last_status: "sent",
                patient_email_last_attempt_at:
                  data.lastAttemptAt ?? b.patient_email_last_attempt_at,
                patient_email_staff_resend_count:
                  data.staffResendCount ?? b.patient_email_staff_resend_count,
              }
            : b
        )
      );
      showFeedback({
        type: "success",
        message: `Confirmación reenviada a ${booking.patient_email}.`,
      });
    } catch (err) {
      console.warn("[citas] resend confirmation failed:", err);
      showFeedback({ type: "error", message: "Error de red al reenviar." });
    } finally {
      setResendingId(null);
    }
  };

  const resetManualForm = () => {
    setManualDate("");
    setManualTime("");
    setManualService(services[0]?.id ?? "");
    setManualName("");
    setManualEmail("");
    setManualPhone("");
    setManualNotes("");
    setSelectedPatient(null);
    setShowPatientDropdown(false);
    setManualError(null);
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

  // Calls admin_create_booking (see
  // 0036_admin_create_booking_rpc.sql) instead of inserting directly — the
  // RPC sets starts_at/ends_at and relies on the bookings_no_overlap
  // exclusion constraint for the same overlap guarantee confirm_booking
  // gets on the public site, then deletes every now-overlapping
  // available_slots row (any service) so the slot stops showing as
  // bookable to patients. Unlike confirm_booking, date/time are free-form
  // here — staff aren't limited to a pre-generated available_slots row,
  // since manual bookings routinely fall outside published hours.
  const saveManualBooking = async () => {
    if (!manualDate || !manualTime || !manualService || !manualName.trim()) return;
    setSavingManual(true);
    setManualError(null);

    // Interpret the picked date/time as Tijuana wall-clock (the clinic's
    // own local time), not the admin's browser timezone.
    const p_slot_start = tijuanaWallClockToIso(manualDate, manualTime);

    const { data, error: rpcError } = await supabase.rpc("admin_create_booking", {
      p_service_id:    manualService,
      p_slot_start,
      p_patient_name:  manualName.trim(),
      p_patient_email: manualEmail.trim() || null,
      p_patient_phone: manualPhone.trim() || null,
      p_notes:         manualNotes.trim() || null,
    });

    const result = data?.[0] as
      | { success: boolean; booking_id: string | null; booking_ref: string | null; error_code: string | null }
      | undefined;

    if (rpcError || !result?.success) {
      console.error("admin_create_booking error:", rpcError?.message, result?.error_code);
      setManualError(
        result?.error_code === "slot_overlap"
          ? "Esa hora se cruza con otra cita ya agendada. Elige otra hora."
          : result?.error_code === "invalid_service"
          ? "Selecciona un servicio válido."
          : result?.error_code === "missing_fields"
          ? "Falta el nombre de la paciente."
          : "Error al guardar la cita. Intenta de nuevo."
      );
      setSavingManual(false);
      return;
    }

    setSavingManual(false);
    showFeedback({ type: "success", message: `Cita creada. Ref: ${result.booking_ref}` });
    setShowManualForm(false);
    resetManualForm();
    fetchSlots();
    fetchBookings();
  };

  // ── Derived ────────────────────────────────────────────────────────────
  /** Patients whose name contains what Katya has typed so far (max 8). */
  const filteredPatients =
    !selectedPatient && manualName.trim().length >= 1
      ? (patients ?? [])
          .filter((p) =>
            (p.full_name?.toLowerCase() ?? "").includes(manualName.toLowerCase().trim())
          )
          .slice(0, 8)
      : [];

  const selectedIso = selectedDate ? dateToIso(selectedDate) : null;
  const rangeBounds = rangeBoundsFor(rangePreset);

  const filteredBookings = (bookings ?? []).filter((b) => {
    const matchesSearch =
      search.trim() === "" ||
      (b.patient_name?.toLowerCase() ?? "").includes(search.toLowerCase().trim());
    if (!matchesSearch) return false;
    // A picked calendar day wins over the range preset.
    if (selectedIso !== null) return b.date === selectedIso;
    if (rangeBounds.from && b.date < rangeBounds.from) return false;
    if (rangeBounds.to && b.date > rangeBounds.to) return false;
    return true;
  });

  /** Group filtered bookings by YYYY-MM for phone-friendly month sections. */
  const bookingsByMonth: { key: string; label: string; items: Booking[] }[] = [];
  {
    const map = new Map<string, Booking[]>();
    for (const b of filteredBookings) {
      const key = b.date.slice(0, 7);
      const list = map.get(key);
      if (list) list.push(b);
      else map.set(key, [b]);
    }
    for (const [key, items] of map) {
      bookingsByMonth.push({ key, label: monthHeading(key), items });
    }
  }

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
            {tab === "citas" && !bookingsLoading && filteredBookings.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[rgba(192,138,94,0.15)] text-[var(--color-bronze)] text-[10px] font-semibold">
                {filteredBookings.length}
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
                {(() => {
                  type SlotGroup = { isoDate: string; label: string; items: typeof slots };
                  const groups: SlotGroup[] = [];
                  const seen = new Map<string, number>();
                  slots.forEach((slot) => {
                    const isoDate = slot.start_time.slice(0, 10);
                    const { date: dateLabel } = formatSlotTime(slot.start_time);
                    if (!seen.has(isoDate)) {
                      seen.set(isoDate, groups.length);
                      groups.push({ isoDate, label: dateLabel, items: [slot] });
                    } else {
                      groups[seen.get(isoDate)!].items.push(slot);
                    }
                  });
                  return (
                    <div className="p-6 space-y-5">
                      {groups.map((group) => (
                        <div key={group.isoDate}>
                          <p className="mb-2.5 text-xs font-semibold capitalize tracking-[0.1em] text-slate-500 first:mt-0 mt-1">
                            {group.label}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {group.items.map((slot) => {
                              const { time: timeStr } = formatSlotTime(slot.start_time);
                              return (
                                <div
                                  key={slot.id}
                                  className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 pl-3 pr-1.5 py-1.5 text-xs text-slate-700"
                                >
                                  <span className="font-medium tabular-nums">{timeStr}</span>
                                  <button
                                    onClick={() => deleteSlot(slot.id)}
                                    aria-label="Eliminar horario"
                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                                  >
                                    <Trash2 size={11} strokeWidth={1.75} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
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
          {/* ── Mini calendar ────────────────────────────────────── */}
          {(() => {
            const year  = currentMonth.getFullYear();
            const month = currentMonth.getMonth();
            const cells = buildCalendarCells(year, month);
            const todayIso = getTodayIso();
            // Build a Set of ISO dates that have at least one booking
            const bookedDates = new Set(bookings.map((b) => b.date));
            const monthLabel = currentMonth.toLocaleDateString("es-MX", {
              month: "long", year: "numeric",
            });
            return (
              <div className="mb-6 rounded-3xl bg-white border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-5">
                {/* Month nav */}
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Mes anterior"
                  >
                    <ChevronLeft size={15} strokeWidth={2} />
                  </button>
                  <span className="text-sm font-semibold capitalize text-slate-700">{monthLabel}</span>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Mes siguiente"
                  >
                    <ChevronRight size={15} strokeWidth={2} />
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-1">
                  {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map((d) => (
                    <div key={d} className="py-1 text-center text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-y-0.5">
                  {cells.map((day, i) => {
                    if (!day) return <div key={i} />;
                    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isSelected = selectedIso === iso;
                    const isToday    = iso === todayIso;
                    const hasBooking = bookedDates.has(iso);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedDate(isSelected ? null : new Date(year, month, day))}
                        className={`relative mx-auto flex h-8 w-8 flex-col items-center justify-center rounded-full text-[13px] font-medium transition-colors ${
                          isSelected
                            ? "bg-[var(--color-bronze)] text-white"
                            : isToday
                            ? "font-semibold text-[var(--color-bronze)] ring-1 ring-[var(--color-bronze)]"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                        aria-label={iso}
                      >
                        <span className="leading-none">{day}</span>
                        {hasBooking && (
                          <span
                            className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
                              isSelected ? "bg-white/70" : "bg-[var(--color-bronze)]"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected-day label / clear */}
                {selectedDate && (
                  <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
                    <p className="text-xs text-slate-500 capitalize">
                      {selectedDate.toLocaleDateString("es-MX", {
                        weekday: "long", day: "numeric", month: "long",
                      })}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setSelectedDate(null); router.replace("/admin/citas"); }}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-slate-600"
                    >
                      <X size={11} strokeWidth={2} /> Limpiar
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Range presets — default upcoming 30 days */}
          <div className="mb-4 flex flex-wrap gap-2">
            {(
              [
                ["upcoming30", "Próximos 30 días"],
                ["past30", "Últimos 30 días"],
                ["thisMonth", "Este mes"],
                ["nextMonth", "Mes siguiente"],
                ["all", "Todas"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setRangePreset(id);
                  setSelectedDate(null);
                  if (todayFilter) router.replace("/admin/citas");
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  rangePreset === id && !selectedIso
                    ? "bg-[var(--color-bronze)] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

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
                  {search
                    ? "Sin resultados"
                    : selectedIso
                    ? "Sin citas este día"
                    : rangePreset === "upcoming30"
                    ? "Sin citas en los próximos 30 días"
                    : "No hay citas en este rango"}
                </p>
                <p className="max-w-xs text-xs leading-relaxed text-[var(--color-text-muted)]">
                  {search
                    ? `No se encontraron citas para "${search}".`
                    : selectedIso
                    ? "No hay citas programadas para este día."
                    : "Prueba otro rango o crea una cita manual."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table header */}
                <div className="hidden lg:grid grid-cols-[88px_1fr_140px_36px_100px_110px_auto] items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-3 text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  <span>Fecha</span>
                  <span>Paciente</span>
                  <span>Servicio</span>
                  <span>WA</span>
                  <span>Estado</span>
                  <span>Email</span>
                  <span>Acciones</span>
                </div>

                {bookingsByMonth.map((group) => (
                  <div key={group.key}>
                    <div className="sticky top-0 z-[1] border-b border-slate-100 bg-[rgba(248,250,252,0.96)] px-6 py-2.5 backdrop-blur-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-bronze)] capitalize">
                        {group.label}
                        <span className="ml-2 font-normal normal-case tracking-normal text-slate-400">
                          {group.items.length} {group.items.length === 1 ? "cita" : "citas"}
                        </span>
                      </p>
                    </div>
                    {group.items.map((booking, idx) => {
                  const svcName =
                    services.find((s) => s.id === booking.service_id)?.es.name ??
                    booking.service_id;
                  return (
                    <div
                      key={booking.id}
                      className={`flex flex-col lg:grid lg:grid-cols-[88px_1fr_140px_36px_100px_110px_auto] lg:items-center gap-3 lg:gap-3 px-6 py-5 ${
                        idx !== group.items.length - 1 ? "border-b border-slate-50" : ""
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
                      {(() => {
                        const matchedPatient = booking.patient_email
                          ? patients.find(
                              (p) =>
                                p.email &&
                                p.email.toLowerCase() === booking.patient_email!.toLowerCase()
                            )
                          : undefined;
                        return (
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {matchedPatient ? (
                                <Link
                                  href={`/admin/pacientes/${matchedPatient.id}`}
                                  className="truncate text-sm font-medium text-slate-800 underline-offset-2 hover:text-[var(--color-bronze)] hover:underline transition-colors"
                                >
                                  {booking.patient_name}
                                </Link>
                              ) : (
                                <p className="truncate text-sm font-medium text-slate-800">
                                  {booking.patient_name}
                                </p>
                              )}
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
                              <p className="mt-1 text-xs italic text-gray-600">
                                {booking.notes}
                              </p>
                            )}
                          </div>
                        );
                      })()}

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

                      {/* Patient confirmation email status */}
                      <div className="min-w-0">
                        <EmailStatusChip booking={booking} />
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const blockReason = staffResendBlockReason(booking);
                          const busy = resendingId === booking.id;
                          return (
                            <button
                              type="button"
                              disabled={!!blockReason || busy}
                              title={blockReason ?? "Reenviar correo de confirmación"}
                              onClick={() => setConfirmResend(booking)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[rgba(192,138,94,0.10)] px-3 py-1.5 text-xs font-medium text-[var(--color-bronze)] transition-colors hover:bg-[rgba(192,138,94,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {busy ? (
                                <Loader2 size={11} className="animate-spin" strokeWidth={2.5} />
                              ) : (
                                <Mail size={11} strokeWidth={2.5} />
                              )}
                              Reenviar confirmación
                            </button>
                          );
                        })()}
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
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Count footer */}
          {!bookingsLoading && filteredBookings.length > 0 && (
            <p className="mt-4 text-right text-xs text-[var(--color-text-muted)]">
              {filteredBookings.length} {filteredBookings.length === 1 ? "cita" : "citas"}
              {selectedIso
                ? " · día seleccionado"
                : rangePreset === "upcoming30"
                ? " · próximos 30 días"
                : rangePreset === "past30"
                ? " · últimos 30 días"
                : rangePreset === "thisMonth"
                ? " · este mes"
                : rangePreset === "nextMonth"
                ? " · mes siguiente"
                : " · todas"}
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
              {manualError && (
                <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                  {manualError}
                </p>
              )}

              {/* Date + time — free-form, not limited to available_slots,
                  since manual bookings routinely fall outside published
                  hours (early/late walk-ins, exceptions). */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                    Fecha <span className="normal-case text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                    Hora (Tijuana) <span className="normal-case text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)]"
                  />
                </div>
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
                  {services.map((s) => (
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
                disabled={!manualDate || !manualTime || !manualService || !manualName.trim() || savingManual}
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

      {/* Confirm resend patient confirmation email */}
      {confirmResend && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmResend(null);
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-slate-800">
              Reenviar confirmación
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              ¿Reenviar el correo de confirmación a{" "}
              <span className="font-medium text-slate-800">
                {confirmResend.patient_email}
              </span>
              {" "}({confirmResend.patient_name})?
            </p>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Máximo {STAFF_RESEND_MAX} reenvíos manuales por cita · espera ~2–3 min entre envíos.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmResend(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={resendingId === confirmResend.id}
                onClick={() => resendPatientConfirmation(confirmResend)}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-bronze)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-bronze-hover)] disabled:opacity-50"
              >
                {resendingId === confirmResend.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Mail size={14} />
                )}
                Reenviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
