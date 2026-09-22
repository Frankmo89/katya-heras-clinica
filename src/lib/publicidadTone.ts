/** Tone presets for Publicidad UI (single-select chips). */
export const PUBLICIDAD_TONE_PRESETS = [
  {
    id: "calido",
    label: "Cálido",
    tone: "cálido, cercano, humano; sin exagerar promesas",
  },
  {
    id: "educativo",
    label: "Educativo",
    tone: "educativo, claro, basado en el corpus; tono de terapeuta que explica",
  },
  {
    id: "promo_suave",
    label: "Promo suave",
    tone: "promoción suave, invitacional; CTA claro sin presión agresiva ni descuentos inventados",
  },
] as const;

export type PublicidadTonePresetId =
  (typeof PUBLICIDAD_TONE_PRESETS)[number]["id"];

export function toneForPreset(
  id: string | null | undefined,
): (typeof PUBLICIDAD_TONE_PRESETS)[number] | null {
  if (!id) return null;
  return PUBLICIDAD_TONE_PRESETS.find((p) => p.id === id) ?? null;
}
