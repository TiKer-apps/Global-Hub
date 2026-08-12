export interface EventTypePreset {
  id: string
  label: string
  // Couleur CSS appliquée directement en style inline sur la case de
  // l'event (cf. `WeekGrid`/`WeekMinimal`/`MonthGrid`, `backgroundColor:
  // event.color`) — pas une classe Tailwind comme dans `theme-presets.ts`,
  // `color` est une donnée persistée par event, pas un thème d'UI statique.
  color: string
}

export const EVENT_TYPE_PRESETS: EventTypePreset[] = [
  { id: 'travail', label: 'Travail', color: '#93c5fd' },
  { id: 'perso', label: 'Perso', color: '#86efac' },
  { id: 'sante', label: 'Santé', color: '#fca5a5' },
  { id: 'loisirs', label: 'Loisirs', color: '#fdba74' },
  { id: 'autre', label: 'Autre', color: '#d4d4d8' },
]

export function getEventTypePreset(id: string | undefined): EventTypePreset | undefined {
  return EVENT_TYPE_PRESETS.find((preset) => preset.id === id)
}
