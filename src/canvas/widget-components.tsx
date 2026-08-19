import type { ComponentType } from 'react'
import { PlanningWidget } from '@/modules/planning/PlanningWidget'
import { NotesWidget } from '@/modules/notes/NotesWidget'
import { PostItWidget } from '@/modules/post-its/PostItWidget'
import { TasksWidget } from '@/modules/tasks/TasksWidget'
import { TodoListWidget } from '@/modules/todo-list/TodoListWidget'
import { ImportantWidget } from '@/modules/important/ImportantWidget'

// Un module fixe du board (cf. module-registry.ts) = un composant widget,
// aucun d'eux ne consomme de props (ils lisent leur propre id via
// `useNodeId()` quand ils ont besoin de se situer sur le canvas) — table
// partagée par HubCanvas (où elle sert de `nodeTypes` à `<ReactFlow>`, clé =
// id du module = aussi son `type` de node, les deux valent la même chaîne
// ici) et par le layout mobile (MobileHub.tsx), qui n'a pas de notion de
// Node du tout et se contente de cette table pour savoir quel composant
// rendre pour quel id de module.
export const WIDGET_COMPONENTS: Record<string, ComponentType> = {
  'important-1': ImportantWidget,
  'planning-week': () => <PlanningWidget config={{ view: 'week', mode: 'extended' }} />,
  'notes-1': NotesWidget,
  'tasks-1': () => <TasksWidget />,
  'post-it-1': PostItWidget,
  'todo-1': () => <TodoListWidget />,
}
