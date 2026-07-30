import type { Importable } from '@/lib/types'

export interface Task extends Importable {
  id: string
  title: string
  // Texte brut (pas de mise en forme riche) : une ligne commençant par '-'
  // devient une case à cocher suivie du texte, une ligne normale reste du
  // texte simple — cf. TaskPreview pour le rendu, TasksWidget pour l'édition.
  content: string
  createdAt: string
  updatedAt: string
}
