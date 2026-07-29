export type TextFont = 'sans' | 'handwritten' | 'marker' | 'typewriter'

// Polices "stylées" partagées par les notes et les post-its. Piles système
// uniquement pour l'instant (pas de nouvelle dépendance webfont) — à
// raffiner plus tard si besoin de vraies polices dédiées (ex.
// @fontsource/caveat pour le manuscrit).
export const TEXT_FONTS: { value: TextFont; label: string; fontFamily: string }[] = [
  { value: 'sans', label: 'Simple', fontFamily: 'inherit' },
  { value: 'handwritten', label: 'Manuscrite', fontFamily: "'Bradley Hand', 'Comic Sans MS', cursive" },
  { value: 'marker', label: 'Feutre', fontFamily: "'Marker Felt', 'Segoe Print', 'Comic Sans MS', cursive" },
  { value: 'typewriter', label: 'Machine à écrire', fontFamily: "'Courier New', monospace" },
]
