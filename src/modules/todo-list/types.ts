import type { Importable } from '@/lib/types'
import type { ChecklistLine } from '@/modules/checklist/types'

export interface TodoSheet extends Importable {
  id: string
  // Une fois détachée, la fiche n'est plus un texte riche éditable : le HTML
  // rédigé sur le bloc (cf. TodoListWidget) est éclaté en lignes au moment du
  // détachement — même modèle que ChecklistWidget (isItem/done), pour
  // cocher/rayer chaque ligne au clic (cf. TodoSheetNote).
  lines: ChecklistLine[]
  createdAt: string
  // Position sur le canvas — une fiche détachée du bloc est un node React
  // Flow indépendant, sa position doit être persistée (comme les post-its).
  x: number
  y: number
}
