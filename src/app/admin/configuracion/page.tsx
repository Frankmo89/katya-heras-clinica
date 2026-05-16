"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, Clock, Plus, Trash2, Check, AlertCircle, Building2, ShoppingBag, FileText, DollarSign, Palette, Upload, X } from "lucide-react";
import { type ClinicSettings, CLINIC_SETTINGS_DEFAULTS } from "@/lib/clinicSettings";
import type { Currency } from "@/lib/format";
import { type ShopSettings, SHOP_SETTINGS_DEFAULTS } from "@/lib/shopSettings";
import { type BookingSettings, BOOKING_SETTINGS_DEFAULTS } from "@/lib/bookingSettings";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type DaySchedule = {
  id?: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
};

type ScheduleException = {
  id: string;
  exception_date: string;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
  reason: string | null;
};

type BlockedSlot = {
  id: string;
  blocked_date: string;
  blocked_time: string;
  reason: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day_of_week: 0, is_open: false, open_time: "09:00", close_time: "18:00" },
  { day_of_week: 1, is_open: true,  open_time: "09:00", close_time: "18:00" },
  { day_of_week: 2, is_open: true,  open_time: "09:00", close_time: "18:00" },
  { day_of_week: 3, is_open: true,  open_time: "09:00", close_time: "18:00" },
  { day_of_week: 4, is_open: true,  open_time: "09:00", close_time: "18:00" },
  { day_of_week: 5, is_open: true,  open_time: "09:00", close_time: "18:00" },
  { day_of_week: 6, is_open: false, open_time: "09:00", close_time: "14:00" },
];

// ─── CmsImageField component ──────────────────────────────────────────────────

function CmsImageField({
  label,
  hint,
  value,
  onClear,
  onUpload,
  uploading,
  aspectRatio = "4/3",
}: {
  label: string;
  hint?: string;
  value: string | null;
  onClear: () => void;
  onUpload: (file: File) => void;
  uploading: boolean;
  aspectRatio?: string;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
        {label}
        {hint && <span className="normal-case font-normal text-slate-300 ml-1">{hint}</span>}
      </label>
      {value && (
        <div className="relative mb-3 w-40 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label}
            className="w-full object-cover"
            style={{ aspectRatio }}
          />
          <button
            type="button"
            onClick={onClear}
            aria-label="Quitar imagen"
            className="absolute top-2 right-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/80 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      )}
      <label
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 hover:border-[var(--color-bronze)] hover:text-[var(--color-bronze)] transition-colors cursor-pointer ${
          uploading ? "opacity-60 cursor-not-allowed pointer-events-none" : ""
        }`}
      >
        {uploading ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-[var(--color-bronze)] animate-spin" />
            Subiendo…
          </>
        ) : (
          <>
            <Upload size={15} strokeWidth={1.75} />
            {value ? "Cambiar imagen" : "Subir imagen"}
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bronze)] focus-visible:ring-offset-2 ${
        checked ? "bg-[var(--color-bronze)]" : "bg-slate-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Feedback banner type ─────────────────────────────────────────────────────

type FeedbackState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ConfiguracionPage() {
  // Weekly schedule state
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  // Exceptions state
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [exceptionsLoading, setExceptionsLoading] = useState(true);

  // New exception form
  const [newDate, setNewDate] = useState("");
  const [newIsClosed, setNewIsClosed] = useState(true);
  const [newOpenTime, setNewOpenTime] = useState("09:00");
  const [newCloseTime, setNewCloseTime] = useState("14:00");
  const [newReason, setNewReason] = useState("");
  const [addingException, setAddingException] = useState(false);

  // Clinic info state
  const [clinicInfo, setClinicInfo]     = useState<ClinicSettings>(CLINIC_SETTINGS_DEFAULTS);
  const [infoLoading, setInfoLoading]   = useState(true);
  const [infoSaving, setInfoSaving]     = useState(false);
  const [emailError, setEmailError]     = useState<string | null>(null);

  // Shop settings state
  const [shopInfo, setShopInfo]       = useState<ShopSettings>(SHOP_SETTINGS_DEFAULTS);
  const [shopLoading, setShopLoading] = useState(true);
  const [shopSaving, setShopSaving]   = useState(false);

  // Blocked slots state
  const [blockedSlotsList, setBlockedSlotsList] = useState<BlockedSlot[]>([]);
  const [bsLoading, setBsLoading]               = useState(true);
  const [newBsDate, setNewBsDate]               = useState("");
  const [newBsTime, setNewBsTime]               = useState("09:00");
  const [newBsReason, setNewBsReason]           = useState("");
  const [addingBs, setAddingBs]                 = useState(false);

  // Booking settings state
  const [bookingInfo, setBookingInfo]     = useState<BookingSettings>(BOOKING_SETTINGS_DEFAULTS);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [bookingSaving, setBookingSaving]   = useState(false);
  // Raw string states for numeric inputs so backspace / clear works properly
  const [rawMinHours, setRawMinHours] = useState(String(BOOKING_SETTINGS_DEFAULTS.min_hours_advance));
  const [rawMaxDays,  setRawMaxDays]  = useState(String(BOOKING_SETTINGS_DEFAULTS.max_days_advance));

  // Hero appearance state
  const [heroSaving, setHeroSaving]       = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);

  // CMS content state
  const [cmsSaving, setCmsSaving]                 = useState(false);
  const [cmsUploadingField, setCmsUploadingField] = useState<keyof ClinicSettings | null>(null);

  // Feedback
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<"horarios" | "clinica" | "web">("horarios");

  const showFeedback = (fb: FeedbackState) => {
    setFeedback(fb);
    setTimeout(() => setFeedback(null), 4000);
  };

  // ── Fetch weekly schedule ──────────────────────────────────────────────────

  const fetchSchedule = useCallback(async () => {
    setScheduleLoading(true);
    const { data, error } = await supabase
      .from("clinic_schedule")
      .select("*")
      .order("day_of_week", { ascending: true });

    if (error) {
      console.error("Error fetching schedule:", error);
      setScheduleLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const merged = DEFAULT_SCHEDULE.map((def) => {
        const dbRow = data.find((r) => r.day_of_week === def.day_of_week);
        return dbRow
          ? {
              id: dbRow.id,
              day_of_week: dbRow.day_of_week,
              is_open: dbRow.is_open,
              open_time: dbRow.open_time ?? def.open_time,
              close_time: dbRow.close_time ?? def.close_time,
            }
          : def;
      });
      setSchedule(merged);
    }
    setScheduleLoading(false);
  }, []);

  // ── Fetch exceptions ───────────────────────────────────────────────────────

  // ── Fetch clinic info ─────────────────────────────────────────────────────

  const fetchClinicInfo = useCallback(async () => {
    setInfoLoading(true);
    const { data, error } = await supabase
      .from("clinic_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (!error && data) setClinicInfo(data as ClinicSettings);
    setInfoLoading(false);
  }, []);

  // ── Fetch shop settings ─────────────────────────────────────────────────────

  const fetchShopInfo = useCallback(async () => {
    setShopLoading(true);
    const { data, error } = await supabase
      .from("shop_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (!error && data) setShopInfo(data as ShopSettings);
    setShopLoading(false);
  }, []);

  // ── Fetch blocked slots ──────────────────────────────────────────────────

  const fetchBlockedSlots = useCallback(async () => {
    setBsLoading(true);
    const { data, error } = await supabase
      .from("blocked_slots")
      .select("*")
      .order("blocked_date")
      .order("blocked_time");
    if (error) console.error("Error fetching blocked slots:", error);
    else setBlockedSlotsList(data ?? []);
    setBsLoading(false);
  }, []);

  const addBlockedSlot = async () => {
    if (!newBsDate || !newBsTime) return;
    setAddingBs(true);
    const { error } = await supabase.from("blocked_slots").insert({
      blocked_date: newBsDate,
      blocked_time: newBsTime,
      reason: newBsReason.trim() || null,
    });
    setAddingBs(false);
    if (error) {
      showFeedback({
        type: "error",
        message:
          error.code === "23505"
            ? "Ya existe un bloqueo para esa fecha y hora."
            : "Error al añadir el bloqueo.",
      });
    } else {
      showFeedback({ type: "success", message: "Horario bloqueado correctamente." });
      setNewBsDate("");
      setNewBsReason("");
      fetchBlockedSlots();
    }
  };

  const deleteBlockedSlot = async (id: string) => {
    const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
    if (error) {
      showFeedback({ type: "error", message: "Error al eliminar el bloqueo." });
    } else {
      setBlockedSlotsList((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // ── Fetch booking settings ──────────────────────────────────────────────────

  const fetchBookingInfo = useCallback(async () => {
    setBookingLoading(true);
    const { data, error } = await supabase
      .from("booking_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (!error && data) {
      const bs = data as BookingSettings;
      setBookingInfo(bs);
      setRawMinHours(String(bs.min_hours_advance));
      setRawMaxDays(String(bs.max_days_advance));
    }
    setBookingLoading(false);
  }, []);

  const fetchExceptions = useCallback(async () => {
    setExceptionsLoading(true);
    const { data, error } = await supabase
      .from("schedule_exceptions")
      .select("*")
      .order("exception_date", { ascending: true });

    if (error) {
      console.error("Error fetching exceptions:", error);
    } else {
      setExceptions(data ?? []);
    }
    setExceptionsLoading(false);
  }, []);

  useEffect(() => {
    fetchSchedule();
    fetchExceptions();
    fetchClinicInfo();
    fetchShopInfo();
    fetchBookingInfo();
    fetchBlockedSlots();
  }, [fetchSchedule, fetchExceptions, fetchClinicInfo, fetchShopInfo, fetchBookingInfo, fetchBlockedSlots]);

  // ── Update a single day in local state ────────────────────────────────────

  const updateDay = (
    dayOfWeek: number,
    field: keyof Omit<DaySchedule, "id" | "day_of_week">,
    value: boolean | string
  ) => {
    setSchedule((prev) =>
      prev.map((d) => (d.day_of_week === dayOfWeek ? { ...d, [field]: value } : d))
    );
  };

  // ── Save weekly schedule ───────────────────────────────────────────────────

  const saveSchedule = async () => {
    setScheduleSaving(true);
    const rows = schedule.map(({ id, ...rest }) => ({
      ...(id ? { id } : {}),
      ...rest,
    }));

    const { error } = await supabase
      .from("clinic_schedule")
      .upsert(rows, { onConflict: "day_of_week" });

    setScheduleSaving(false);
    if (error) {
      showFeedback({ type: "error", message: "Error al guardar los horarios." });
    } else {
      showFeedback({ type: "success", message: "Horarios guardados correctamente." });
      fetchSchedule();
    }
  };

  // ── Add exception ──────────────────────────────────────────────────────────

  const addException = async () => {
    if (!newDate) return;
    setAddingException(true);

    const payload: Omit<ScheduleException, "id"> = {
      exception_date: newDate,
      is_closed: newIsClosed,
      open_time: newIsClosed ? null : newOpenTime,
      close_time: newIsClosed ? null : newCloseTime,
      reason: newReason.trim() || null,
    };

    const { error } = await supabase.from("schedule_exceptions").insert(payload);
    setAddingException(false);

    if (error) {
      if (error.code === "23505") {
        showFeedback({ type: "error", message: "Ya existe una excepción para esa fecha." });
      } else {
        showFeedback({ type: "error", message: "Error al añadir la excepción." });
      }
    } else {
      showFeedback({ type: "success", message: "Excepción añadida correctamente." });
      setNewDate("");
      setNewReason("");
      setNewIsClosed(true);
      fetchExceptions();
    }
  };

  // ── Delete exception ───────────────────────────────────────────────────────

  const deleteException = async (id: string) => {
    const { error } = await supabase
      .from("schedule_exceptions")
      .delete()
      .eq("id", id);

    if (error) {
      showFeedback({ type: "error", message: "Error al eliminar la excepción." });
    } else {
      setExceptions((prev) => prev.filter((e) => e.id !== id));
    }
  };

  // ── Save clinic info ───────────────────────────────────────────────────────

  const saveClinicInfo = async () => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clinicInfo.contact_email);
    if (!emailOk) {
      setEmailError("El formato del email no es válido.");
      return;
    }
    setEmailError(null);
    setInfoSaving(true);
    const { error } = await supabase
      .from("clinic_settings")
      .upsert({ ...clinicInfo, id: 1 }, { onConflict: "id" });
    setInfoSaving(false);
    if (error) {
      showFeedback({ type: "error", message: "Error al guardar los datos del centro." });
    } else {
      showFeedback({ type: "success", message: "Datos del centro actualizados correctamente." });
    }
  };

  // ── Save shop settings ─────────────────────────────────────────────────────

  const saveShopInfo = async () => {
    // Validation: cannot enable shipping with $0 cost
    if (shopInfo.shipping_enabled && Number(shopInfo.shipping_cost) === 0) {
      showFeedback({
        type: "error",
        message:
          "El envío está habilitado pero el costo es $0. Añade un costo o desactiva el envío a domicilio.",
      });
      return;
    }
    setShopSaving(true);
    const { error } = await supabase
      .from("shop_settings")
      .upsert({ ...shopInfo, id: 1 }, { onConflict: "id" });
    setShopSaving(false);
    if (error) {
      showFeedback({ type: "error", message: "Error al guardar la configuración de tienda." });
    } else {
      showFeedback({ type: "success", message: "Configuración de tienda guardada correctamente." });
    }
  };

  // ── Save booking settings ──────────────────────────────────────────────────

  const saveBookingInfo = async () => {
    const minHours = rawMinHours === "" ? 0 : Math.max(0, parseInt(rawMinHours, 10) || 0);
    const maxDays  = rawMaxDays  === "" ? 1 : Math.max(1, parseInt(rawMaxDays,  10) || 1);
    if (minHours < 0) {
      showFeedback({ type: "error", message: "Las horas mínimas de anticipación no pueden ser negativas." });
      return;
    }
    if (maxDays < 1) {
      showFeedback({ type: "error", message: "Los días máximos deben ser al menos 1." });
      return;
    }
    setBookingSaving(true);
    const { error } = await supabase
      .from("booking_settings")
      .upsert({ ...bookingInfo, id: 1, min_hours_advance: minHours, max_days_advance: maxDays }, { onConflict: "id" });
    setBookingSaving(false);
    if (error) {
      showFeedback({ type: "error", message: "Error al guardar las políticas de reservas." });
    } else {
      showFeedback({ type: "success", message: "Políticas de reservas guardadas correctamente." });
    }
  };

  // ── Upload hero image to Supabase Storage ────────────────────────────────

  const uploadHeroImage = async (file: File) => {
    setHeroUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `hero/hero-image.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("public_assets")
      .upload(fileName, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      showFeedback({ type: "error", message: "Error al subir la imagen." });
      setHeroUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("public_assets")
      .getPublicUrl(fileName);

    setClinicInfo((prev) => ({ ...prev, hero_image_url: urlData.publicUrl }));
    setHeroUploading(false);
    showFeedback({ type: "success", message: "Imagen subida. Guarda los cambios para aplicarla." });
  };

  // ── Save hero appearance settings ─────────────────────────────────────────

  const saveHeroSettings = async () => {
    setHeroSaving(true);
    const { error } = await supabase
      .from("clinic_settings")
      .update({
        hero_title: clinicInfo.hero_title || null,
        hero_subtitle: clinicInfo.hero_subtitle || null,
        hero_image_url: clinicInfo.hero_image_url || null,
      })
      .eq("id", 1);
    setHeroSaving(false);
    if (error) {
      showFeedback({ type: "error", message: "Error al guardar la apariencia." });
    } else {
      showFeedback({ type: "success", message: "Apariencia de la página guardada correctamente." });
    }
  };

  // ── Upload CMS image to Supabase Storage ──────────────────────────────────

  const uploadCmsImage = async (
    file: File,
    storageName: string,
    fieldKey: keyof ClinicSettings,
  ) => {
    setCmsUploadingField(fieldKey);
    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `cms/${storageName}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("public_assets")
      .upload(fileName, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      showFeedback({ type: "error", message: "Error al subir la imagen." });
      setCmsUploadingField(null);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("public_assets")
      .getPublicUrl(fileName);

    setClinicInfo((prev) => ({ ...prev, [fieldKey]: urlData.publicUrl }));
    setCmsUploadingField(null);
    showFeedback({ type: "success", message: "Imagen subida. Guarda los cambios para aplicarla." });
  };

  // ── Save CMS content settings ──────────────────────────────────────────────

  const saveCmsSettings = async () => {
    setCmsSaving(true);
    const { error } = await supabase
      .from("clinic_settings")
      .update({
        philosophy_image_url:    clinicInfo.philosophy_image_url    || null,
        testimonials_list:       clinicInfo.testimonials_list,
        about_practice_image_url: clinicInfo.about_practice_image_url || null,
        about_practice_text:     clinicInfo.about_practice_text     || null,
        about_gallery_1_url:     clinicInfo.about_gallery_1_url     || null,
        about_gallery_2_url:     clinicInfo.about_gallery_2_url     || null,
        about_gallery_3_url:     clinicInfo.about_gallery_3_url     || null,
        about_location_image_url: clinicInfo.about_location_image_url || null,
      })
      .eq("id", 1);
    setCmsSaving(false);
    if (error) {
      showFeedback({ type: "error", message: "Error al guardar el contenido." });
    } else {
      showFeedback({ type: "success", message: "Contenido de las páginas guardado correctamente." });
    }
  };

  // ── Format date for display ────────────────────────────────────────────────

  const formatDate = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-bronze)] font-medium">
        Administración
      </span>
      <h1 className="font-serif text-4xl mt-2 text-slate-800">Configuración</h1>
      <p className="text-sm text-[var(--color-text-muted)] mt-2">
        Gestiona los horarios, datos de contacto, tienda y excepciones del centro.
      </p>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`mt-6 flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <Check size={16} strokeWidth={2.5} />
          ) : (
            <AlertCircle size={16} strokeWidth={2.5} />
          )}
          {feedback.message}
        </div>
      )}

      {/* ── Tab navigation ───────────────────────────────────────────────────── */}
      <div className="mt-8 flex items-end border-b border-slate-100 overflow-x-auto">
        {(
          [
            { value: "horarios", label: "Horarios",  icon: "🕒" },
            { value: "clinica",  label: "Clínica",   icon: "🏥" },
            { value: "web",      label: "Sitio Web", icon: "💻" },
          ] as const
        ).map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveTab(value)}
            className={`shrink-0 -mb-px pb-3 px-5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === value
                ? "border-[var(--color-bronze)] text-[var(--color-bronze)]"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
            }`}
          >
            <span className="mr-1.5">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* ── Horarios tab ─────────────────────────────────────────────────────── */}
      {activeTab === "horarios" && (
        <div className="space-y-8">

      {/* ── Section 1: Horarios Habituales ─────────────────────────────────── */}
      <section className="mt-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(192,138,94,0.10)]">
            <Clock size={18} className="text-[var(--color-bronze)]" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-slate-800">Horarios Habituales</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Configura el horario semanal estándar del centro.
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
          {scheduleLoading ? (
            <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">
              Cargando horarios…
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)] font-medium">
                <span>Día</span>
                <span className="text-center">Abierto</span>
                <span className="text-center">Apertura</span>
                <span className="text-center">Cierre</span>
              </div>

              {schedule.map((day, idx) => (
                <div
                  key={day.day_of_week}
                  className={`grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3 sm:gap-4 items-center px-6 py-4 ${
                    idx !== schedule.length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  {/* Day name */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        day.is_open ? "bg-[var(--color-bronze)]" : "bg-slate-300"
                      }`}
                    />
                    <span
                      className={`font-medium text-sm ${
                        day.is_open ? "text-slate-800" : "text-slate-400"
                      }`}
                    >
                      {DAY_NAMES[day.day_of_week]}
                    </span>
                  </div>

                  {/* Toggle */}
                  <div className="flex sm:justify-center items-center gap-2">
                    <span className="sm:hidden text-xs text-[var(--color-text-muted)]">
                      Abierto
                    </span>
                    <Toggle
                      checked={day.is_open}
                      onChange={(val) => updateDay(day.day_of_week, "is_open", val)}
                    />
                  </div>

                  {/* Open time */}
                  <div className="flex sm:justify-center items-center gap-2">
                    <span className="sm:hidden text-xs text-[var(--color-text-muted)] w-16">
                      Apertura
                    </span>
                    <input
                      type="time"
                      value={day.open_time}
                      onChange={(e) =>
                        updateDay(day.day_of_week, "open_time", e.target.value)
                      }
                      disabled={!day.is_open}
                      className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed w-[108px]"
                    />
                  </div>

                  {/* Close time */}
                  <div className="flex sm:justify-center items-center gap-2">
                    <span className="sm:hidden text-xs text-[var(--color-text-muted)] w-16">
                      Cierre
                    </span>
                    <input
                      type="time"
                      value={day.close_time}
                      onChange={(e) =>
                        updateDay(day.day_of_week, "close_time", e.target.value)
                      }
                      disabled={!day.is_open}
                      className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed w-[108px]"
                    />
                  </div>
                </div>
              ))}

              {/* Save button */}
              <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={saveSchedule}
                  disabled={scheduleSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-bronze)] hover:bg-[var(--color-bronze-hover)] text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {scheduleSaving ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    "Guardar horarios"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Section 2: Días Festivos y Bloqueos ─────────────────────────────── */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(192,138,94,0.10)]">
            <Calendar size={18} className="text-[var(--color-bronze)]" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-slate-800">Días Festivos y Bloqueos</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Bloquea fechas específicas o establece horarios especiales para un día concreto.
            </p>
          </div>
        </div>

        {/* Add exception form */}
        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 mb-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Añadir excepción</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-[0.1em]">
                Fecha
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-[0.1em]">
                Motivo <span className="normal-case">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Festivo nacional, Vacaciones…"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
              />
            </div>
          </div>

          {/* Closed toggle */}
          <div className="mt-4 flex items-center gap-3">
            <Toggle checked={newIsClosed} onChange={setNewIsClosed} />
            <span className="text-sm text-slate-700">
              {newIsClosed ? "Día completamente cerrado" : "Horario especial"}
            </span>
          </div>

          {/* Special hours (only if not fully closed) */}
          {!newIsClosed && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-[0.1em]">
                  Apertura
                </label>
                <input
                  type="time"
                  value={newOpenTime}
                  onChange={(e) => setNewOpenTime(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-[0.1em]">
                  Cierre
                </label>
                <input
                  type="time"
                  value={newCloseTime}
                  onChange={(e) => setNewCloseTime(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="mt-5 flex justify-end">
            <button
              onClick={addException}
              disabled={!newDate || addingException}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-bronze)] hover:bg-[var(--color-bronze-hover)] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingException ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Añadiendo…
                </>
              ) : (
                <>
                  <Plus size={15} strokeWidth={2.5} />
                  Añadir excepción
                </>
              )}
            </button>
          </div>
        </div>

        {/* Exceptions list */}
        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
          {exceptionsLoading ? (
            <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">
              Cargando excepciones…
            </div>
          ) : exceptions.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">
                No hay excepciones registradas.
              </p>
              <p className="text-xs text-slate-300 mt-1">
                Usa el formulario anterior para añadir festivos o bloqueos.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)] font-medium">
                <span>Fecha</span>
                <span>Estado</span>
                <span>Horario especial</span>
                <span />
              </div>

              {exceptions.map((exc, idx) => (
                <div
                  key={exc.id}
                  className={`grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3 sm:gap-4 items-center px-6 py-4 ${
                    idx !== exceptions.length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  {/* Date + reason */}
                  <div>
                    <p className="text-sm font-medium text-slate-800 capitalize">
                      {formatDate(exc.exception_date)}
                    </p>
                    {exc.reason && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {exc.reason}
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      exc.is_closed
                        ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {exc.is_closed ? "Cerrado" : "Horario especial"}
                  </span>

                  {/* Special hours */}
                  <span className="text-sm text-slate-500">
                    {!exc.is_closed && exc.open_time && exc.close_time
                      ? `${exc.open_time.slice(0, 5)} – ${exc.close_time.slice(0, 5)}`
                      : "—"}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={() => deleteException(exc.id)}
                    aria-label="Eliminar excepción"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} strokeWidth={1.75} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* ── Section 2b: Bloqueo de Horarios Específicos ───────────────────── */}
      <section className="mt-6">
        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 mb-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Bloquear horario específico</h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            Bloquea una hora concreta dentro de un día habilado (ej. reservas ya ocupadas, pausa).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-[0.1em]">Fecha</label>
              <input
                type="date"
                value={newBsDate}
                onChange={(e) => setNewBsDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-[0.1em]">Hora</label>
              <input
                type="time"
                value={newBsTime}
                onChange={(e) => setNewBsTime(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1.5 uppercase tracking-[0.1em]">Motivo <span className="normal-case">(opcional)</span></label>
              <input
                type="text"
                placeholder="Ej: Cita ocupada, Descanso…"
                value={newBsReason}
                onChange={(e) => setNewBsReason(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={addBlockedSlot}
              disabled={!newBsDate || !newBsTime || addingBs}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-bronze)] hover:bg-[var(--color-bronze-hover)] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingBs ? (
                <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Añadiendo…</>
              ) : (
                <><Plus size={15} strokeWidth={2.5} />Bloquear horario</>
              )}
            </button>
          </div>
        </div>

        {/* Blocked slots list */}
        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
          {bsLoading ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Cargando…</div>
          ) : blockedSlotsList.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">No hay horarios bloqueados.</p>
            </div>
          ) : (
            <>
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)] font-medium">
                <span>Fecha</span><span>Hora</span><span>Motivo</span><span />
              </div>
              {blockedSlotsList.map((bs, idx) => (
                <div
                  key={bs.id}
                  className={`grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3 sm:gap-4 items-center px-6 py-4 ${
                    idx !== blockedSlotsList.length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  <p className="text-sm font-medium text-slate-800 capitalize">
                    {formatDate(bs.blocked_date)}
                  </p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                    {bs.blocked_time.slice(0, 5)}
                  </span>
                  <span className="text-sm text-slate-400">{bs.reason ?? "—"}</span>
                  <button
                    onClick={() => deleteBlockedSlot(bs.id)}
                    aria-label="Eliminar bloqueo"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} strokeWidth={1.75} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

        </div>
      )}

      {/* ── Clínica tab ──────────────────────────────────────────────────────── */}
      {activeTab === "clinica" && (
        <div className="space-y-8">

      {/* ── Section 3: Datos de la Clínica ────────────────────────────────── */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(192,138,94,0.10)]">
            <Building2 size={18} className="text-[var(--color-bronze)]" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-slate-800">Datos de la Clínica</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Información de contacto visible en la web y en los correos de confirmación.
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
          {infoLoading ? (
            <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">
              Cargando datos…
            </div>
          ) : (
            <>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* WhatsApp / Phone */}
                <div>
                  <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                    WhatsApp / Teléfono
                  </label>
                  <input
                    type="tel"
                    value={clinicInfo.whatsapp_number}
                    onChange={(e) =>
                      setClinicInfo((prev) => ({ ...prev, whatsapp_number: e.target.value }))
                    }
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
                    placeholder="+52 664 000 0000"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                    Email de contacto
                  </label>
                  <input
                    type="email"
                    value={clinicInfo.contact_email}
                    onChange={(e) => {
                      setClinicInfo((prev) => ({ ...prev, contact_email: e.target.value }));
                      setEmailError(null);
                    }}
                    className={`w-full text-sm border rounded-xl px-3 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent ${
                      emailError ? "border-red-300 bg-red-50" : "border-slate-200"
                    }`}
                    placeholder="hola@ejemplo.mx"
                  />
                  {emailError && (
                    <p className="mt-1 text-xs text-red-500">{emailError}</p>
                  )}
                </div>

                {/* Physical address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                    Dirección física
                  </label>
                  <input
                    type="text"
                    value={clinicInfo.physical_address}
                    onChange={(e) =>
                      setClinicInfo((prev) => ({ ...prev, physical_address: e.target.value }))
                    }
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
                    placeholder="Av. Hidalgo 142, Tecate, BC"
                  />
                </div>

                {/* Maps URL */}
                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                    URL de Google Maps
                  </label>
                  <input
                    type="url"
                    value={clinicInfo.maps_url}
                    onChange={(e) =>
                      setClinicInfo((prev) => ({ ...prev, maps_url: e.target.value }))
                    }
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
                    placeholder="https://maps.google.com/?q=..."
                  />
                </div>

                {/* Instagram */}
                <div>
                  <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                    Instagram <span className="normal-case">(opcional)</span>
                  </label>
                  <input
                    type="url"
                    value={clinicInfo.instagram_url ?? ""}
                    onChange={(e) =>
                      setClinicInfo((prev) => ({
                        ...prev,
                        instagram_url: e.target.value || null,
                      }))
                    }
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
                    placeholder="https://instagram.com/..."
                  />
                </div>

                {/* Facebook */}
                <div>
                  <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                    Facebook <span className="normal-case">(opcional)</span>
                  </label>
                  <input
                    type="url"
                    value={clinicInfo.facebook_url ?? ""}
                    onChange={(e) =>
                      setClinicInfo((prev) => ({
                        ...prev,
                        facebook_url: e.target.value || null,
                      }))
                    }
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
                    placeholder="https://facebook.com/..."
                  />
                </div>

                {/* Pre-appointment instructions */}
                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                    Qué traer{" "}
                    <span className="normal-case font-normal text-slate-300">(una línea por ítem)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={clinicInfo.instructions_pre_appointment ?? ""}
                    onChange={(e) =>
                      setClinicInfo((prev) => ({ ...prev, instructions_pre_appointment: e.target.value || null }))
                    }
                    placeholder={"Ropa cómoda y elástica\nEstudios médicos previos si los tienes"}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
                  />
                </div>

                {/* Arrival instructions */}
                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                    Cómo llegar{" "}
                    <span className="normal-case font-normal text-slate-300">(una línea por ítem)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={clinicInfo.instructions_arrival ?? ""}
                    onChange={(e) =>
                      setClinicInfo((prev) => ({ ...prev, instructions_arrival: e.target.value || null }))
                    }
                    placeholder={"Estacionamiento gratuito en la calle paralela\nA 4 cuadras de la Línea Internacional"}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
                  />
                </div>

                {/* ── Currency selector ── */}
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={14} className="text-[var(--color-bronze)]" strokeWidth={1.5} />
                    <label className="text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                      Moneda de precios
                    </label>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Afecta la visualización de precios en servicios, reservas y tienda para todos los visitantes.
                  </p>
                  <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 gap-1">
                    {(["MXN", "USD"] as Currency[]).map((opt) => {
                      const active = clinicInfo.currency === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setClinicInfo((prev) => ({ ...prev, currency: opt }))}
                          className={`relative rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200 ${
                            active
                              ? "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.10)] text-[var(--color-bronze)]"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {opt === "MXN" ? "🇲🇽  Pesos (MXN)" : "🇺🇸  Dólares (USD)"}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Save button */}
              <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={saveClinicInfo}
                  disabled={infoSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-bronze)] hover:bg-[var(--color-bronze-hover)] text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {infoSaving ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    "Guardar datos"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Section 5: Políticas de Reservas ────────────────────────────────── */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(192,138,94,0.10)]">
            <FileText size={18} className="text-[var(--color-bronze)]" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-slate-800">Políticas de Reservas</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Controla cuándo y con cuánta antelación pueden reservar los pacientes.
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
          {bookingLoading ? (
            <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">
              Cargando políticas…
            </div>
          ) : (
            <>
              <div className="p-6 space-y-8">

                {/* ─── Master on/off switch ─── */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Sistema de reservas online
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      Desactívalo para mostrar un mensaje de "no disponible" en la página pública.
                    </p>
                  </div>
                  <Toggle
                    checked={bookingInfo.is_booking_enabled}
                    onChange={(val) =>
                      setBookingInfo((prev) => ({ ...prev, is_booking_enabled: val }))
                    }
                  />
                </div>

                {/* Inline warning when disabled */}
                {!bookingInfo.is_booking_enabled && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                    <AlertCircle size={15} strokeWidth={2} className="shrink-0 mt-0.5" />
                    <span>
                      Las reservas online están <strong>desactivadas</strong>. Los pacientes verán
                      un mensaje pidiéndoles que contacten por WhatsApp.
                    </span>
                  </div>
                )}

                <hr className="border-slate-100" />

                {/* ─── Advance notice ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                  {/* Min hours advance */}
                  <div>
                    <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                      Horas mínimas de anticipación
                    </label>
                    <p className="text-xs text-slate-400 mb-3">
                      Los horarios con menos de esta antelación no aparecerán disponibles.
                    </p>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={168}
                        step={1}
                        value={rawMinHours}
                        onChange={(e) => setRawMinHours(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 pr-16 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
                        placeholder="24"
                      />
                      <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 pointer-events-none">
                        horas
                      </span>
                    </div>
                  </div>

                  {/* Max days advance */}
                  <div>
                    <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                      Días máximos hacia adelante
                    </label>
                    <p className="text-xs text-slate-400 mb-3">
                      El calendario no mostrará fechas más allá de este límite.
                    </p>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={365}
                        step={1}
                        value={rawMaxDays}
                        onChange={(e) => setRawMaxDays(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 pr-12 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
                        placeholder="60"
                      />
                      <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 pointer-events-none">
                        días
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Save button */}
              <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={saveBookingInfo}
                  disabled={bookingSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-bronze)] hover:bg-[var(--color-bronze-hover)] text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {bookingSaving ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    "Guardar políticas"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Section 4: Configuración de Tienda ───────────────────────────────── */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(192,138,94,0.10)]">
            <ShoppingBag size={18} className="text-[var(--color-bronze)]" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-slate-800">Configuración de Tienda</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Define las opciones de envío y recogida para los productos físicos.
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
          {shopLoading ? (
            <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">
              Cargando configuración…
            </div>
          ) : (
            <>
              <div className="p-6 space-y-8">

                {/* ─── Shipping ─── */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Envío a domicilio</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        Habilita el envío de productos físicos a los clientes.
                      </p>
                    </div>
                    <Toggle
                      checked={shopInfo.shipping_enabled}
                      onChange={(val) =>
                        setShopInfo((prev) => ({ ...prev, shipping_enabled: val }))
                      }
                    />
                  </div>

                  {/* Inline warning: shipping enabled but cost is $0 */}
                  {shopInfo.shipping_enabled && Number(shopInfo.shipping_cost) === 0 && (
                    <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                      <AlertCircle size={15} strokeWidth={2} className="shrink-0 mt-0.5" />
                      <span>
                        El envío está habilitado pero el costo es{" "}
                        <strong>$0</strong>. Añade un costo o desactívalo para guardar.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Shipping cost */}
                    <div>
                      <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                        Costo de envío (MXN)
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm pointer-events-none">
                          $
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={shopInfo.shipping_cost}
                          onChange={(e) =>
                            setShopInfo((prev) => ({
                              ...prev,
                              shipping_cost: Number(e.target.value) || 0,
                            }))
                          }
                          disabled={!shopInfo.shipping_enabled}
                          className="w-full text-sm border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
                          placeholder="150"
                        />
                      </div>
                    </div>

                    {/* Free shipping threshold */}
                    <div>
                      <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                        Envío gratis a partir de{" "}
                        <span className="normal-case font-normal text-slate-300">(0 = sin umbral)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm pointer-events-none">
                          $
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={shopInfo.free_shipping_threshold}
                          onChange={(e) =>
                            setShopInfo((prev) => ({
                              ...prev,
                              free_shipping_threshold: Number(e.target.value) || 0,
                            }))
                          }
                          disabled={!shopInfo.shipping_enabled}
                          className="w-full text-sm border border-slate-200 rounded-xl pl-7 pr-3 py-2.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
                          placeholder="1500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* ─── Pickup ─── */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Recogida en centro</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        Los clientes pueden recoger su pedido directamente en la clínica.
                      </p>
                    </div>
                    <Toggle
                      checked={shopInfo.pickup_enabled}
                      onChange={(val) =>
                        setShopInfo((prev) => ({ ...prev, pickup_enabled: val }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                      Instrucciones de recogida{" "}
                      <span className="normal-case">(opcional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={shopInfo.pickup_instructions ?? ""}
                      onChange={(e) =>
                        setShopInfo((prev) => ({
                          ...prev,
                          pickup_instructions: e.target.value || null,
                        }))
                      }
                      disabled={!shopInfo.pickup_enabled}
                      placeholder="Ej: Recoger en recepción de lunes a viernes de 09:00 a 18:00."
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

              </div>

              {/* Save button */}
              <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={saveShopInfo}
                  disabled={shopSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-bronze)] hover:bg-[var(--color-bronze-hover)] text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {shopSaving ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    "Guardar configuración"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

        </div>
      )}

      {/* ── Web tab ──────────────────────────────────────────────────────────── */}
      {activeTab === "web" && (
        <div className="space-y-8">

      {/* ── Section 6: Apariencia de la Página ──────────────────────────────── */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(192,138,94,0.10)]">
            <Palette size={18} className="text-[var(--color-bronze)]" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-slate-800">Apariencia de la Página</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Personaliza el texto principal y la imagen de portada de la página de inicio.
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
          {infoLoading ? (
            <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">
              Cargando apariencia…
            </div>
          ) : (
            <>
              <div className="p-6 space-y-5">

                {/* Título principal */}
                <div>
                  <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                    Título Principal{" "}
                    <span className="normal-case font-normal text-slate-300">(deja vacío para usar el predeterminado)</span>
                  </label>
                  <input
                    type="text"
                    value={clinicInfo.hero_title ?? ""}
                    onChange={(e) =>
                      setClinicInfo((prev) => ({ ...prev, hero_title: e.target.value || null }))
                    }
                    placeholder="Tu cuerpo recuerda. Yo te escucho."
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
                  />
                </div>

                {/* Subtítulo */}
                <div>
                  <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                    Subtítulo{" "}
                    <span className="normal-case font-normal text-slate-300">(deja vacío para usar el predeterminado)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={clinicInfo.hero_subtitle ?? ""}
                    onChange={(e) =>
                      setClinicInfo((prev) => ({ ...prev, hero_subtitle: e.target.value || null }))
                    }
                    placeholder="Osteopatía manual y terapias suaves en un espacio diseñado para que el sistema nervioso, por fin, se afloje."
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white resize-none placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
                  />
                </div>

                {/* Imagen de portada */}
                <div>
                  <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                    Imagen de Portada{" "}
                    <span className="normal-case font-normal text-slate-300">(reemplaza el vídeo predeterminado)</span>
                  </label>

                  {/* Preview */}
                  {clinicInfo.hero_image_url && (
                    <div className="relative mb-3 w-48 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={clinicInfo.hero_image_url}
                        alt="Vista previa de portada"
                        className="w-full aspect-[4/5] object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setClinicInfo((prev) => ({ ...prev, hero_image_url: null }))
                        }
                        aria-label="Quitar imagen"
                        className="absolute top-2 right-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/80 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}

                  {/* Upload button */}
                  <label
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 hover:border-[var(--color-bronze)] hover:text-[var(--color-bronze)] transition-colors cursor-pointer ${
                      heroUploading ? "opacity-60 cursor-not-allowed pointer-events-none" : ""
                    }`}
                  >
                    {heroUploading ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-[var(--color-bronze)] animate-spin" />
                        Subiendo imagen…
                      </>
                    ) : (
                      <>
                        <Upload size={15} strokeWidth={1.75} />
                        {clinicInfo.hero_image_url ? "Cambiar imagen" : "Subir imagen"}
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={heroUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadHeroImage(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <p className="mt-2 text-xs text-slate-400">
                    JPG, PNG o WebP · Relación 4:5 recomendada · máx. 5 MB
                  </p>
                </div>

              </div>

              {/* Save button */}
              <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={saveHeroSettings}
                  disabled={heroSaving || heroUploading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-bronze)] hover:bg-[var(--color-bronze-hover)] text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {heroSaving ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    "Guardar apariencia"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Section 7: Gestor de Contenidos (Páginas) ───────────────────────── */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(192,138,94,0.10)]">
            <FileText size={18} className="text-[var(--color-bronze)]" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-slate-800">Gestor de Contenidos (Páginas)</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Imágenes y textos visibles en la página principal y en la página Nosotros.
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
          {infoLoading ? (
            <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">
              Cargando contenido…
            </div>
          ) : (
            <>
              <div className="p-6 space-y-10">

                {/* ── A. Página Principal ──────────────────────────────── */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[rgba(192,138,94,0.12)] text-[var(--color-bronze)] text-[10px] font-bold">A</span>
                    Página Principal
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mb-5">
                    Sección de filosofía y bloque de testimonial/reseña.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                    {/* Philosophy image */}
                    <div className="sm:col-span-2">
                      <CmsImageField
                        label="Imagen de Filosofía"
                        hint="(sección 'Trabajo con manos, no con prisa')"
                        value={clinicInfo.philosophy_image_url ?? null}
                        onClear={() =>
                          setClinicInfo((prev) => ({ ...prev, philosophy_image_url: null }))
                        }
                        onUpload={(file) =>
                          uploadCmsImage(file, "philosophy-image", "philosophy_image_url")
                        }
                        uploading={cmsUploadingField === "philosophy_image_url"}
                        aspectRatio="1/1.1"
                      />
                    </div>

                    {/* Testimonials array manager */}
                    <div className="sm:col-span-2">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                            Reseñas del Carrusel
                          </label>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Deja la lista vacía para usar las reseñas predeterminadas del sitio.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {clinicInfo.testimonials_list.map((t, i) => (
                          <div
                            key={i}
                            className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-start rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                          >
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1">
                                Cita
                              </label>
                              <textarea
                                rows={2}
                                value={t.quote}
                                onChange={(e) => {
                                  const updated = [...clinicInfo.testimonials_list];
                                  updated[i] = { ...updated[i], quote: e.target.value };
                                  setClinicInfo((prev) => ({ ...prev, testimonials_list: updated }));
                                }}
                                placeholder="« La cita de la reseña… »"
                                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 bg-white resize-none placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1">
                                Autor
                              </label>
                              <input
                                type="text"
                                value={t.author}
                                onChange={(e) => {
                                  const updated = [...clinicInfo.testimonials_list];
                                  updated[i] = { ...updated[i], author: e.target.value };
                                  setClinicInfo((prev) => ({ ...prev, testimonials_list: updated }));
                                }}
                                placeholder="Nombre · Paciente"
                                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
                              />
                            </div>
                            <div className="flex items-start pt-[22px]">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = clinicInfo.testimonials_list.filter((_, idx) => idx !== i);
                                  setClinicInfo((prev) => ({ ...prev, testimonials_list: updated }));
                                }}
                                aria-label="Eliminar reseña"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={15} strokeWidth={1.75} />
                              </button>
                            </div>
                          </div>
                        ))}

                        {clinicInfo.testimonials_list.length === 0 && (
                          <p className="text-xs text-slate-400 py-3 px-4 rounded-2xl border border-dashed border-slate-200 text-center">
                            Sin reseñas — se mostrarán las predeterminadas del sitio.
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setClinicInfo((prev) => ({
                            ...prev,
                            testimonials_list: [...prev.testimonials_list, { quote: "", author: "" }],
                          }))
                        }
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 hover:border-[var(--color-bronze)] hover:text-[var(--color-bronze)] transition-colors"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        Agregar otra reseña
                      </button>
                    </div>

                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* ── B. Página Nosotros ───────────────────────────────── */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[rgba(192,138,94,0.12)] text-[var(--color-bronze)] text-[10px] font-bold">B</span>
                    Página Nosotros
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mb-5">
                    Foto de la práctica, texto descriptivo, galería del espacio e imagen de localización.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                    {/* Practice image */}
                    <CmsImageField
                      label="Imagen de la Práctica"
                      hint="(foto de Katya · relación 4:5)"
                      value={clinicInfo.about_practice_image_url ?? null}
                      onClear={() =>
                        setClinicInfo((prev) => ({ ...prev, about_practice_image_url: null }))
                      }
                      onUpload={(file) =>
                        uploadCmsImage(file, "about-practice", "about_practice_image_url")
                      }
                      uploading={cmsUploadingField === "about_practice_image_url"}
                      aspectRatio="4/5"
                    />

                    {/* Practice text */}
                    <div className="flex flex-col">
                      <label className="block text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                        Texto de la Práctica{" "}
                        <span className="normal-case font-normal text-slate-300">(deja vacío para el texto predeterminado)</span>
                      </label>
                      <textarea
                        rows={7}
                        value={clinicInfo.about_practice_text ?? ""}
                        onChange={(e) =>
                          setClinicInfo((prev) => ({
                            ...prev,
                            about_practice_text: e.target.value || null,
                          }))
                        }
                        placeholder={"Katya Heras es osteópata certificada con más de doce años de práctica clínica...\n\nCada sesión está diseñada para que el cuerpo, y el sistema nervioso, recuerden cómo descansar."}
                        className="w-full flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 bg-white resize-none placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-bronze)] focus:border-transparent"
                      />
                      <p className="mt-1.5 text-xs text-slate-400">Doble salto de línea para separar párrafos.</p>
                    </div>

                    {/* Gallery image 1 */}
                    <CmsImageField
                      label="Galería — Imagen 1"
                      hint="(imagen grande · relación 4:3)"
                      value={clinicInfo.about_gallery_1_url ?? null}
                      onClear={() =>
                        setClinicInfo((prev) => ({ ...prev, about_gallery_1_url: null }))
                      }
                      onUpload={(file) =>
                        uploadCmsImage(file, "about-gallery-1", "about_gallery_1_url")
                      }
                      uploading={cmsUploadingField === "about_gallery_1_url"}
                    />

                    {/* Gallery image 2 */}
                    <CmsImageField
                      label="Galería — Imagen 2"
                      hint="(imagen mediana · relación 4:3)"
                      value={clinicInfo.about_gallery_2_url ?? null}
                      onClear={() =>
                        setClinicInfo((prev) => ({ ...prev, about_gallery_2_url: null }))
                      }
                      onUpload={(file) =>
                        uploadCmsImage(file, "about-gallery-2", "about_gallery_2_url")
                      }
                      uploading={cmsUploadingField === "about_gallery_2_url"}
                    />

                    {/* Gallery image 3 */}
                    <CmsImageField
                      label="Galería — Imagen 3"
                      hint="(imagen pequeña · relación 4:3)"
                      value={clinicInfo.about_gallery_3_url ?? null}
                      onClear={() =>
                        setClinicInfo((prev) => ({ ...prev, about_gallery_3_url: null }))
                      }
                      onUpload={(file) =>
                        uploadCmsImage(file, "about-gallery-3", "about_gallery_3_url")
                      }
                      uploading={cmsUploadingField === "about_gallery_3_url"}
                    />

                    {/* Location image */}
                    <CmsImageField
                      label="Imagen de Localización"
                      hint="(mapa o fachada · relación 4:3)"
                      value={clinicInfo.about_location_image_url ?? null}
                      onClear={() =>
                        setClinicInfo((prev) => ({ ...prev, about_location_image_url: null }))
                      }
                      onUpload={(file) =>
                        uploadCmsImage(file, "about-location", "about_location_image_url")
                      }
                      uploading={cmsUploadingField === "about_location_image_url"}
                    />

                  </div>
                </div>

              </div>

              {/* Save button */}
              <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={saveCmsSettings}
                  disabled={cmsSaving || cmsUploadingField !== null}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-bronze)] hover:bg-[var(--color-bronze-hover)] text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {cmsSaving ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    "Guardar contenido"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

        </div>
      )}

    </div>
  );
}
