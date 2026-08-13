export interface EventTypePreset {
  id: string
  // Clé de traduction (`planning.type.<id>`), pas le libellé affiché
  // directement — résolue via `t()` au point de rendu (`EventFormModal`),
  // sinon la donnée elle-même serait figée dans une langue.
  labelKey: string
  // Couleur CSS appliquée directement en style inline sur la case de
  // l'event (cf. `WeekGrid`/`WeekMinimal`/`MonthGrid`, `backgroundColor:
  // event.color`) — pas une classe Tailwind comme dans `theme-presets.ts`,
  // `color` est une donnée persistée par event, pas un thème d'UI statique.
  color: string
}

export const EVENT_TYPE_PRESETS: EventTypePreset[] = [
  { id: 'travail', labelKey: 'planning.type.travail', color: '#93c5fd' },
  { id: 'perso', labelKey: 'planning.type.perso', color: '#86efac' },
  { id: 'sante', labelKey: 'planning.type.sante', color: '#fca5a5' },
  { id: 'loisirs', labelKey: 'planning.type.loisirs', color: '#fdba74' },
  { id: 'autre', labelKey: 'planning.type.autre', color: '#d4d4d8' },
]

export function getEventTypePreset(id: string | undefined): EventTypePreset | undefined {
  return EVENT_TYPE_PRESETS.find((preset) => preset.id === id)
}
