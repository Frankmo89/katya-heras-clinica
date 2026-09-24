// Shared schedule formatting for footer, Nosotros, and JSON-LD consumers.

export type DayScheduleLike = {
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
};

type DayGroup = {
  startDay: number;
  endDay: number;
  openTime: string;
  closeTime: string;
};

function buildGroups(days: DayScheduleLike[]): DayGroup[] {
  const open = days.filter((d) => d.is_open && d.open_time && d.close_time);
  if (open.length === 0) return [];

  const groups: DayGroup[] = [];
  let cur: DayGroup = {
    startDay: open[0].day_of_week,
    endDay: open[0].day_of_week,
    openTime: open[0].open_time!.slice(0, 5),
    closeTime: open[0].close_time!.slice(0, 5),
  };

  for (let i = 1; i < open.length; i++) {
    const d = open[i];
    const ot = d.open_time!.slice(0, 5);
    const ct = d.close_time!.slice(0, 5);
    if (d.day_of_week === cur.endDay + 1 && ot === cur.openTime && ct === cur.closeTime) {
      cur.endDay = d.day_of_week;
    } else {
      groups.push(cur);
      cur = { startDay: d.day_of_week, endDay: d.day_of_week, openTime: ot, closeTime: ct };
    }
  }
  groups.push(cur);
  return groups;
}

/** Human-readable schedule lines, e.g. "Lun – Vie · 15:00 – 20:00". */
export function formatScheduleLines(
  days: DayScheduleLike[],
  lang: "es" | "en",
): string[] {
  // day_of_week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const names =
    lang === "es"
      ? ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return buildGroups(days).map((g) => {
    const label =
      g.startDay === g.endDay
        ? names[g.startDay]
        : `${names[g.startDay]} – ${names[g.endDay]}`;
    return `${label} · ${g.openTime} – ${g.closeTime}`;
  });
}

/** schema.org OpeningHoursSpecification entries from clinic_schedule rows. */
export function toOpeningHoursSpecification(days: DayScheduleLike[]) {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ] as const;

  return days
    .filter((d) => d.is_open && d.open_time && d.close_time)
    .map((d) => ({
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: dayNames[d.day_of_week] ?? "Monday",
      opens: d.open_time!.slice(0, 5),
      closes: d.close_time!.slice(0, 5),
    }));
}
