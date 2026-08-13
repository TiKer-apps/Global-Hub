import type { EventSource } from './types'

// Accent de bordure gauche par provenance — canal visuel séparé du
// remplissage de la case (couleur de type/event à venir, cf. PROJECT.md
// "À affiner") pour ne jamais entrer en collision avec lui. `local` (créé
// à la main dans l'app) reste neutre : pas de bordure distinctive, seuls
// les events importés en ont une.
const SOURCE_BORDER_CLASS: Record<EventSource, string> = {
  local: 'border-l-transparent',
  google: 'border-l-blue-500',
  outlook: 'border-l-indigo-500',
}

export function sourceBorderClass(source: EventSource): string {
  return SOURCE_BORDER_CLASS[source]
}

// Clé de traduction (`planning.source.<source>`), résolue via `t()` au
// point de rendu — même principe que `EventTypePreset.labelKey`.
export function sourceLabelKey(source: EventSource): string {
  return `planning.source.${source}`
}
