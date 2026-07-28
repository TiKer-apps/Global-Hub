import Dexie, { type Table } from 'dexie'
import type { CalendarEvent } from '@/modules/planning/types'
import type { Note } from '@/modules/notes/types'
import type { PostIt } from '@/modules/post-its/types'
import type { ChecklistWidgetData } from '@/modules/checklist/types'

class HubDatabase extends Dexie {
  events!: Table<CalendarEvent, string>
  notes!: Table<Note, string>
  postIts!: Table<PostIt, string>
  tasks!: Table<ChecklistWidgetData, string>
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
  }
}

export const db = new HubDatabase()
