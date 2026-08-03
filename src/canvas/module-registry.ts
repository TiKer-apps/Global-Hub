import { CalendarDays, FileText, ListChecks, ListTodo, Star, StickyNote, type LucideIcon } from 'lucide-react'

export interface ModuleDefinition {
  id: string
  label: string
  colorClass: string
  icon: LucideIcon
  // Post-it/Todo-list ont des instances détachées dynamiques (post-its,
  // fiches) qu'on peut aussi afficher/masquer individuellement — cf.
  // ModuleDrawer, qui liste ces sous-vignettes sous la catégorie.
  instanceKind?: 'postIt' | 'todoSheet'
}

// Un "module" = un widget fixe du board (id = celui de son node dans
// HubCanvas) — pas les post-its/fiches détachés eux-mêmes, qui sont des
// instances dynamiques rattachées à leur module via `instanceKind`.
// `colorClass` reprend le `headerClassName` (couleur seule) de chaque widget
// pour garder la même identité visuelle dans le menu des modules.
// Ordre de priorité voulu : Important, Planning, Notes, Tâches, Post-it,
// Todo-list — reflété ici (ordre du drawer) et dans `initialNodes` de
// HubCanvas (agencement du board).
export const MODULES: ModuleDefinition[] = [
  { id: 'important-1', label: 'Important', colorClass: 'bg-orange-300', icon: Star },
  { id: 'planning-week', label: 'Planning', colorClass: 'bg-green-600', icon: CalendarDays },
  { id: 'notes-1', label: 'Notes', colorClass: 'bg-blue-300', icon: FileText },
  { id: 'tasks-1', label: 'Tâches', colorClass: 'bg-violet-500', icon: ListChecks },
  { id: 'post-it-1', label: 'Post-it', colorClass: 'bg-yellow-400', icon: StickyNote, instanceKind: 'postIt' },
  { id: 'todo-1', label: 'Todo-list', colorClass: 'bg-red-500', icon: ListTodo, instanceKind: 'todoSheet' },
]
