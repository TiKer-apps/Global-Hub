import { CalendarDays, FileText, ListChecks, ListTodo, Star, StickyNote, type LucideIcon } from 'lucide-react'

export interface ModuleDefinition {
  id: string
  label: string
  icon: LucideIcon
  // Thème (cf. theme-presets.ts) utilisé tant que rien n'a été personnalisé
  // dans la modale de réglages (cf. module-theme.tsx).
  defaultThemeId: string
  // Post-it/Todo-list ont des instances détachées dynamiques (post-its,
  // fiches) qu'on peut aussi afficher/masquer individuellement — cf.
  // ModuleDrawer, qui liste ces sous-vignettes sous la catégorie.
  instanceKind?: 'postIt' | 'todoSheet'
}

// Un "module" = un widget fixe du board (id = celui de son node dans
// HubCanvas) — pas les post-its/fiches détachés eux-mêmes, qui sont des
// instances dynamiques rattachées à leur module via `instanceKind`.
// Ordre de priorité voulu : Important, Planning, Notes, Tâches, Post-it,
// Todo-list — reflété ici (ordre du drawer) et dans `initialNodes` de
// HubCanvas (agencement du board).
export const MODULES: ModuleDefinition[] = [
  { id: 'important-1', label: 'Important', icon: Star, defaultThemeId: 'orange-300' },
  { id: 'planning-week', label: 'Planning', icon: CalendarDays, defaultThemeId: 'green-600' },
  { id: 'notes-1', label: 'Notes', icon: FileText, defaultThemeId: 'blue-300' },
  { id: 'tasks-1', label: 'Tâches', icon: ListChecks, defaultThemeId: 'violet-500' },
  { id: 'post-it-1', label: 'Post-it', icon: StickyNote, defaultThemeId: 'yellow-400', instanceKind: 'postIt' },
  { id: 'todo-1', label: 'Todo-list', icon: ListTodo, defaultThemeId: 'red-500', instanceKind: 'todoSheet' },
]
