import { CalendarDays, FileText, ListChecks, ListTodo, Star, StickyNote, type LucideIcon } from 'lucide-react'
import type { HeaderStyle } from '@/components/module-card'

export interface ModuleDefinition {
  id: string
  // Clé de traduction (`common.moduleLabels.<id>`), résolue via `t()` au
  // point de rendu (Drawer, modale de réglages) — même principe que
  // `EventTypePreset.labelKey`.
  labelKey: string
  icon: LucideIcon
  // Thème (cf. theme-presets.ts) utilisé tant que rien n'a été personnalisé
  // dans la modale de réglages (cf. module-theme.tsx).
  defaultThemeId: string
  // Style de header (cf. module-style.tsx) utilisé tant que rien n'a été
  // personnalisé dans la modale de réglages.
  defaultStyleId: HeaderStyle
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
  { id: 'important-1', labelKey: 'common.moduleLabels.important', icon: Star, defaultThemeId: 'orange-300', defaultStyleId: 'wave' },
  {
    id: 'planning-week',
    labelKey: 'common.moduleLabels.planning',
    icon: CalendarDays,
    defaultThemeId: 'green-600',
    defaultStyleId: 'wave',
  },
  { id: 'notes-1', labelKey: 'common.moduleLabels.notes', icon: FileText, defaultThemeId: 'blue-300', defaultStyleId: 'wave' },
  { id: 'tasks-1', labelKey: 'common.moduleLabels.tasks', icon: ListChecks, defaultThemeId: 'violet-500', defaultStyleId: 'wave' },
  {
    id: 'post-it-1',
    labelKey: 'common.moduleLabels.postIt',
    icon: StickyNote,
    defaultThemeId: 'yellow-400',
    defaultStyleId: 'wave',
    instanceKind: 'postIt',
  },
  {
    id: 'todo-1',
    labelKey: 'common.moduleLabels.todoList',
    icon: ListTodo,
    defaultThemeId: 'red-500',
    defaultStyleId: 'wave',
    instanceKind: 'todoSheet',
  },
]
