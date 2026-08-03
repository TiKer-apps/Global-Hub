import Dexie, { type Table } from 'dexie'
import type { CalendarEvent } from '@/modules/planning/types'
import type { Note } from '@/modules/notes/types'
import type { PostIt } from '@/modules/post-its/types'
import type { TodoSheet } from '@/modules/todo-list/types'
import type { Task } from '@/modules/tasks/types'
import type { ChecklistWidgetData } from '@/modules/checklist/types'

class HubDatabase extends Dexie {
  events!: Table<CalendarEvent, string>
  notes!: Table<Note, string>
  postIts!: Table<PostIt, string>
  todoSheets!: Table<TodoSheet, string>
  tasks!: Table<Task, string>
  todos!: Table<ChecklistWidgetData, string>

  constructor() {
    super('global-hub')
    this.version(1).stores({
      events: 'id, start, source, important',
      notes: 'id, updatedAt, important',
      postIts: 'id, createdAt, important',
      tasks: 'id',
      todos: 'id',
    })
    // v2 : index sur createdAt pour permettre le tri de la liste des notes
    // par date de création, en plus de la date de modification.
    this.version(2).stores({
      notes: 'id, createdAt, updatedAt, important',
    })
    // v3 : fiches todo-list détachées du bloc (comme les post-its).
    this.version(3).stores({
      todoSheets: 'id, createdAt, important',
    })
    // v4 : "tasks" passe du stub ChecklistWidgetData à un vrai modèle liste
    // + éditeur (comme les notes) — jamais réellement utilisé jusque-là,
    // pas de migration de données à faire.
    this.version(4).stores({
      tasks: 'id, createdAt, updatedAt, important',
    })
    // v5 : index sur externalId pour dédupliquer les events lors d'un
    // ré-import .ics (cf. ics-import.ts).
    this.version(5).stores({
      events: 'id, start, source, important, externalId',
    })
  }
}

export const db = new HubDatabase()
