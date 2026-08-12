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

const SOURCE_LABEL: Record<EventSource, string> = {
  local: 'créé localement',
  google: 'importé de Google',
  outlook: 'importé d’Outlook',
}

export function sourceLabel(source: EventSource): string {
  return SOURCE_LABEL[source]
}
