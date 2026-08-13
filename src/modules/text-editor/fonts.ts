export type TextFont = 'sans' | 'handwritten' | 'marker' | 'typewriter'

// Polices "stylées" partagées par les notes et les post-its. Piles système
// uniquement pour l'instant (pas de nouvelle dépendance webfont) — à
// raffiner plus tard si besoin de vraies polices dédiées (ex.
// @fontsource/caveat pour le manuscrit).
// `labelKey` (pas un libellé direct) : résolu via `t()` au point de rendu
// (`StyleToolbar`), même principe que `EventTypePreset.labelKey`.
export const TEXT_FONTS: { value: TextFont; labelKey: string; fontFamily: string }[] = [
  { value: 'sans', labelKey: 'textEditor.fonts.sans', fontFamily: 'inherit' },
  { value: 'handwritten', labelKey: 'textEditor.fonts.handwritten', fontFamily: "'Bradley Hand', 'Comic Sans MS', cursive" },
  { value: 'marker', labelKey: 'textEditor.fonts.marker', fontFamily: "'Marker Felt', 'Segoe Print', 'Comic Sans MS', cursive" },
  { value: 'typewriter', labelKey: 'textEditor.fonts.typewriter', fontFamily: "'Courier New', monospace" },
]
