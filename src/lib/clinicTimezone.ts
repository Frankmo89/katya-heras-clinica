/**
 * Clinic local timezone (Tecate, B.C.).
 *
 * IANA has no `America/Tecate` zone — Tecate shares `America/Tijuana`
 * (Baja California Norte). Keep this string as the technical ID only;
 * never surface "Tijuana" in user-facing copy.
 */
export const CLINIC_TIMEZONE = "America/Tijuana";
