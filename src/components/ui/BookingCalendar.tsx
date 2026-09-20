"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";

const TZ = "America/Tijuana";
const HORIZON_DAYS = 60; // must match generate_available_slots()'s call range
const GROUP_THRESHOLD = 8; // group into Mañana/Tarde/Noche past this many slots/day

export type PickedSlot = {
  id: string;
  startIso: string;
  /** Tijuana wall-clock date/time, expressed as a browser-local Date so
   *  existing display code (toLocaleDateString, setHours, etc.) reads back
   *  the correct Tijuana numbers regardless of the visitor's own timezone. */
  displayDate: Date;
  displayTime: string; // "HH:MM", Tijuana
};

type SlotRow = { id: string; start_time: string };

// ── Tijuana timezone helpers ────────────────────────────────────────────
// No date library in this project — Intl.DateTimeFormat with an explicit
// timeZone is enough for the wall-clock extraction we need here.
function tijuanaParts(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  let hour = parseInt(parts.hour, 10);
  if (hour === 24) hour = 0; // some ICU builds emit "24" for midnight with hour12:false
  return {
    year: parseInt(parts.year, 10),
    month: parseInt(parts.month, 10), // 1-indexed
    day: parseInt(parts.day, 10),
    hour,
    minute: parseInt(parts.minute, 10),
  };
}

function tijuanaIsoDate(d: Date): string {
  const { year, month, day } = tijuanaParts(d);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function tijuanaTimeLabel(d: Date): string {
  const { hour, minute } = tijuanaParts(d);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// Builds a Date whose LOCAL getters (getFullYear, getHours, toLocaleDateString...)
// return the Tijuana wall-clock numbers, regardless of the browser's own
// timezone — for display-only use, never for instant/arithmetic.
function tijuanaAsLocalDate(d: Date): Date {
  const { year, month, day, hour, minute } = tijuanaParts(d);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

// UTC query window for a given Tijuana calendar month, padded a day on each
// side so no row near the boundary is missed regardless of DST offset (-7/-8).
// Rows outside the target month are discarded client-side after fetching.
function monthQueryRangeUtc(year: number, month0: number) {
  const start = new Date(Date.UTC(year, month0, 1));
  start.setUTCDate(start.getUTCDate() - 1);
  const end = new Date(Date.UTC(year, month0 + 1, 1));
  end.setUTCDate(end.getUTCDate() + 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

// Sunday-first weekday index (0=Sun .. 6=Sat) for the 1st of the month —
// matches the consumer-calendar convention (Google Calendar, most booking
// widgets) used for es-MX/en-US, as opposed to the ISO 8601 Monday-first
// week. Date.getDay() is already 0=Sun-based, so no shift is needed.
function leadingBlanks(year: number, month0: number): number {
  return new Date(year, month0, 1).getDay();
}

function addMonths(year: number, month0: number, delta: number): { year: number; month0: number } {
  const total = year * 12 + month0 + delta;
  return { year: Math.floor(total / 12), month0: ((total % 12) + 12) % 12 };
}

const MONTH_NAMES = {
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};
// Sunday-first, matching leadingBlanks() above.
const WEEKDAY_HEADERS = {
  es: ["D", "L", "M", "M", "J", "V", "S"],
  en: ["S", "M", "T", "W", "T", "F", "S"],
};
// Monday-first — only used to index into by (jsWeekday + 6) % 7 for
// aria-label text, independent of the grid's visual column order above.
const WEEKDAY_NAMES = {
  es: ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};
const PART_LABELS = {
  es: { morning: "Mañana", afternoon: "Tarde", evening: "Noche" },
  en: { morning: "Morning", afternoon: "Afternoon", evening: "Evening" },
};

function partOfDay(hhmm: string): "morning" | "afternoon" | "evening" {
  const h = parseInt(hhmm.split(":")[0], 10);
  if (h < 12) return "morning";
  if (h < 19) return "afternoon";
  return "evening";
}

function formatLongDate(year: number, month0: number, day: number, lang: "es" | "en"): string {
  const jsWeekday = new Date(year, month0, day).getDay();
  const weekday = WEEKDAY_NAMES[lang][(jsWeekday + 6) % 7];
  const month = MONTH_NAMES[lang][month0];
  return lang === "es"
    ? `${weekday} ${day} de ${month}`
    : `${weekday}, ${month} ${day}`;
}

interface BookingCalendarProps {
  serviceId: string;
  selectedSlotId: string | null;
  onSelectSlot: (slot: PickedSlot) => void;
}

export function BookingCalendar({ serviceId, selectedSlotId, onSelectSlot }: BookingCalendarProps) {
  const { lang } = useLanguage();

  const today = useMemo(() => tijuanaParts(new Date()), []);
  const horizon = useMemo(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + HORIZON_DAYS);
    return tijuanaParts(d);
  }, []);

  const [visibleYear, setVisibleYear] = useState(today.year);
  const [visibleMonth0, setVisibleMonth0] = useState(today.month - 1);
  const [monthSlots, setMonthSlots] = useState<Map<string, SlotRow[]>>(new Map());
  const [monthLoading, setMonthLoading] = useState(true);
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const [autoPicking, setAutoPicking] = useState(true);
  const [focusedDay, setFocusedDay] = useState(today.day);
  const [pendingFocus, setPendingFocus] = useState(false);
  const [announce, setAnnounce] = useState("");

  const dayRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // ── One-time pass: find the first day (this month or a following one)
  //    that actually has slots, without loading the full 60-day horizon. ──
  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      setAutoPicking(true);
      setSelectedDateIso(null);
      let py = today.year;
      let pm = today.month - 1;
      for (let attempt = 0; attempt < 3 && !cancelled; attempt++) {
        const { startIso, endIso } = monthQueryRangeUtc(py, pm);
        const { data, error } = await supabase
          .from("available_slots")
          .select("id, start_time")
          .eq("service_id", serviceId)
          .gte("start_time", startIso)
          .lt("start_time", endIso)
          .order("start_time")
          .limit(1);

        if (cancelled) return;
        if (!error && data && data.length > 0) {
          const iso = tijuanaIsoDate(new Date(data[0].start_time));
          const [y, m] = iso.split("-").map(Number);
          setVisibleYear(y);
          setVisibleMonth0(m - 1);
          setSelectedDateIso(iso);
          setFocusedDay(parseInt(iso.split("-")[2], 10));
          setAutoPicking(false);
          return;
        }
        ({ year: py, month0: pm } = addMonths(py, pm, 1));
      }
      if (!cancelled) setAutoPicking(false);
    };

    probe();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  // ── Load slots for whichever month is currently on screen ──────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setMonthLoading(true);
      const { startIso, endIso } = monthQueryRangeUtc(visibleYear, visibleMonth0);
      const { data, error } = await supabase
        .from("available_slots")
        .select("id, start_time")
        .eq("service_id", serviceId)
        .gte("start_time", startIso)
        .lt("start_time", endIso)
        .order("start_time");

      if (cancelled) return;
      if (error) {
        console.error("Error fetching month slots:", error);
        setMonthSlots(new Map());
        setMonthLoading(false);
        return;
      }

      const map = new Map<string, SlotRow[]>();
      for (const row of data ?? []) {
        const iso = tijuanaIsoDate(new Date(row.start_time));
        const [y, m] = iso.split("-").map(Number);
        if (y !== visibleYear || m !== visibleMonth0 + 1) continue; // discard padding-day rows
        if (!map.has(iso)) map.set(iso, []);
        map.get(iso)!.push(row);
      }
      setMonthSlots(map);
      setMonthLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [serviceId, visibleYear, visibleMonth0]);

  useEffect(() => {
    if (!pendingFocus) return;
    const applyFocus = () => {
      dayRefs.current.get(focusedDay)?.focus();
      setPendingFocus(false);
    };
    applyFocus();
  }, [pendingFocus, focusedDay, visibleYear, visibleMonth0]);

  const isPastDay = useCallback(
    (year: number, month0: number, day: number) => {
      const key = year * 10000 + (month0 + 1) * 100 + day;
      const todayKey = today.year * 10000 + today.month * 100 + today.day;
      return key < todayKey;
    },
    [today]
  );

  const isBeyondHorizon = useCallback(
    (year: number, month0: number, day: number) => {
      const key = year * 10000 + (month0 + 1) * 100 + day;
      const horizonKey = horizon.year * 10000 + horizon.month * 100 + horizon.day;
      return key > horizonKey;
    },
    [horizon]
  );

  const canGoPrev = !(visibleYear === today.year && visibleMonth0 === today.month - 1);
  const nextMonth = addMonths(visibleYear, visibleMonth0, 1);
  const canGoNext = !isBeyondHorizon(nextMonth.year, nextMonth.month0, 1);

  const goToMonth = (year: number, month0: number, focusDay: number) => {
    setVisibleYear(year);
    setVisibleMonth0(month0);
    setFocusedDay(focusDay);
    setPendingFocus(true);
  };

  const selectDay = (day: number) => {
    const iso = `${visibleYear}-${String(visibleMonth0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDateIso(iso);
    setFocusedDay(day);
    setAnnounce(
      lang === "es"
        ? `Día seleccionado: ${formatLongDate(visibleYear, visibleMonth0, day, "es")}`
        : `Selected day: ${formatLongDate(visibleYear, visibleMonth0, day, "en")}`
    );
  };

  const moveFocus = (delta: number) => {
    let targetDay = focusedDay + delta;
    let targetYear = visibleYear;
    let targetMonth0 = visibleMonth0;

    if (targetDay < 1) {
      const atEarliestMonth = visibleYear === today.year && visibleMonth0 === today.month - 1;
      if (atEarliestMonth) return; // can't move before the earliest navigable month
      const prev = addMonths(visibleYear, visibleMonth0, -1);
      targetMonth0 = prev.month0;
      targetYear = prev.year;
      targetDay = daysInMonth(targetYear, targetMonth0) + targetDay;
    } else if (targetDay > daysInMonth(visibleYear, visibleMonth0)) {
      const next = addMonths(visibleYear, visibleMonth0, 1);
      if (isBeyondHorizon(next.year, next.month0, 1)) return;
      targetDay = targetDay - daysInMonth(visibleYear, visibleMonth0);
      targetMonth0 = next.month0;
      targetYear = next.year;
    }

    if (targetYear !== visibleYear || targetMonth0 !== visibleMonth0) {
      goToMonth(targetYear, targetMonth0, targetDay);
    } else {
      setFocusedDay(targetDay);
      setPendingFocus(true);
    }
  };

  const handleDayKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        moveFocus(1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        moveFocus(-1);
        break;
      case "ArrowDown":
        e.preventDefault();
        moveFocus(7);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveFocus(-7);
        break;
      case "Home": {
        e.preventDefault();
        const blanks = leadingBlanks(visibleYear, visibleMonth0);
        const weekStart = Math.max(1, focusedDay - (((focusedDay - 1 + blanks) % 7)));
        setFocusedDay(weekStart);
        setPendingFocus(true);
        break;
      }
      case "End": {
        e.preventDefault();
        const blanks = leadingBlanks(visibleYear, visibleMonth0);
        const offsetInWeek = (focusedDay - 1 + blanks) % 7;
        const weekEnd = Math.min(daysInMonth(visibleYear, visibleMonth0), focusedDay + (6 - offsetInWeek));
        setFocusedDay(weekEnd);
        setPendingFocus(true);
        break;
      }
    }
  };

  const selectedDaySlots = useMemo(
    () => (selectedDateIso ? monthSlots.get(selectedDateIso) ?? [] : []),
    [monthSlots, selectedDateIso]
  );

  const handlePickTime = (row: SlotRow) => {
    const displayDate = tijuanaAsLocalDate(new Date(row.start_time));
    const displayTime = tijuanaTimeLabel(new Date(row.start_time));
    onSelectSlot({ id: row.id, startIso: row.start_time, displayDate, displayTime });
    setAnnounce(
      lang === "es" ? `Hora seleccionada: ${displayTime}` : `Selected time: ${displayTime}`
    );
  };

  const blanks = leadingBlanks(visibleYear, visibleMonth0);
  const totalDays = daysInMonth(visibleYear, visibleMonth0);
  const monthLabel = `${MONTH_NAMES[lang][visibleMonth0]} ${visibleYear}`;

  const groupedTimes = useMemo(() => {
    if (selectedDaySlots.length <= GROUP_THRESHOLD) return null;
    const groups: Record<"morning" | "afternoon" | "evening", SlotRow[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    for (const row of selectedDaySlots) {
      groups[partOfDay(tijuanaTimeLabel(new Date(row.start_time)))].push(row);
    }
    return groups;
  }, [selectedDaySlots]);

  const isLoading = autoPicking || monthLoading;

  return (
    <div>
      {/* ── Month header ─────────────────────────────────────────────── */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goToMonth(addMonths(visibleYear, visibleMonth0, -1).year, addMonths(visibleYear, visibleMonth0, -1).month0, 1)}
          disabled={!canGoPrev}
          aria-label={lang === "es" ? "Mes anterior" : "Previous month"}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text)] transition-colors hover:bg-[var(--color-background-soft)] disabled:opacity-25 disabled:hover:bg-transparent"
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>
        <p className="font-serif text-[16px] capitalize text-[var(--color-text)]" aria-live="off">
          {monthLabel}
        </p>
        <button
          type="button"
          onClick={() => goToMonth(nextMonth.year, nextMonth.month0, 1)}
          disabled={!canGoNext}
          aria-label={lang === "es" ? "Mes siguiente" : "Next month"}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text)] transition-colors hover:bg-[var(--color-background-soft)] disabled:opacity-25 disabled:hover:bg-transparent"
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── Weekday header ───────────────────────────────────────────── */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAY_HEADERS[lang].map((h, i) => (
          <div key={i} className="text-center text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            {h}
          </div>
        ))}
      </div>

      {/* ── Day grid ─────────────────────────────────────────────────── */}
      <div role="grid" aria-label={lang === "es" ? "Selector de día" : "Day picker"} className="grid grid-cols-7 gap-1">
        {Array.from({ length: blanks }).map((_, i) => (
          <div key={`blank-${i}`} aria-hidden="true" />
        ))}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const iso = `${visibleYear}-${String(visibleMonth0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasSlots = (monthSlots.get(iso)?.length ?? 0) > 0;
          const past = isPastDay(visibleYear, visibleMonth0, day);
          const disabled = isLoading || past || !hasSlots;
          const isSelected = selectedDateIso === iso;
          const isToday = today.year === visibleYear && today.month - 1 === visibleMonth0 && today.day === day;

          return (
            <button
              key={day}
              ref={(el) => {
                if (el) dayRefs.current.set(day, el);
                else dayRefs.current.delete(day);
              }}
              type="button"
              role="gridcell"
              tabIndex={day === focusedDay ? 0 : -1}
              aria-selected={isSelected}
              aria-disabled={disabled}
              aria-current={isToday ? "date" : undefined}
              aria-label={formatLongDate(visibleYear, visibleMonth0, day, lang)}
              disabled={disabled}
              onFocus={() => setFocusedDay(day)}
              onKeyDown={handleDayKeyDown}
              onClick={() => selectDay(day)}
              className={`flex aspect-square items-center justify-center rounded-full font-sans text-[13px] transition-all duration-150 ${
                isSelected
                  ? "bg-[var(--color-bronze)] font-medium text-white"
                  : disabled
                  ? "text-[rgba(30,41,59,0.25)]"
                  : "text-[var(--color-text)] hover:bg-[var(--color-surface-pink)]"
              } ${isToday && !isSelected ? "ring-1 ring-inset ring-[var(--color-bronze)]/40" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* ── Times for the selected day ───────────────────────────────── */}
      <div className="mt-5">
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[38px] w-16 animate-pulse rounded-full bg-slate-100" />
            ))}
          </div>
        ) : !selectedDateIso || selectedDaySlots.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">
            {lang === "es"
              ? "Elige un día con horarios disponibles."
              : "Pick a day with available times."}
          </p>
        ) : groupedTimes ? (
          <div className="flex flex-col gap-3.5">
            {(["morning", "afternoon", "evening"] as const).map(
              (part) =>
                groupedTimes[part].length > 0 && (
                  <div key={part}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                      {PART_LABELS[lang][part]}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {groupedTimes[part].map((row) => (
                        <TimeButton
                          key={row.id}
                          row={row}
                          selected={selectedSlotId === row.id}
                          onPick={handlePickTime}
                        />
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedDaySlots.map((row) => (
              <TimeButton key={row.id} row={row} selected={selectedSlotId === row.id} onPick={handlePickTime} />
            ))}
          </div>
        )}
      </div>

      {/* Screen-reader announcements for day/time selection */}
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
    </div>
  );
}

function TimeButton({
  row,
  selected,
  onPick,
}: {
  row: SlotRow;
  selected: boolean;
  onPick: (row: SlotRow) => void;
}) {
  const label = tijuanaTimeLabel(new Date(row.start_time));
  return (
    <button
      type="button"
      onClick={() => onPick(row)}
      aria-pressed={selected}
      className={`cursor-pointer rounded-full border px-[18px] py-2 font-sans text-[14px] transition-all duration-200 ${
        selected
          ? "border-[var(--color-bronze)] bg-[var(--color-bronze)] text-white"
          : "border-[rgba(30,41,59,0.15)] bg-[var(--color-background)] text-[var(--color-text)] hover:border-[var(--color-bronze)]"
      }`}
    >
      {label}
    </button>
  );
}
