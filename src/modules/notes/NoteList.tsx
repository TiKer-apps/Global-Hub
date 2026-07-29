import { cn } from '@/lib/utils'
import type { Note } from './types'

interface NoteListProps {
  notes: Note[]
  onSelect: (id: string) => void
  onToggleImportant: (id: string, important: boolean) => void
}

export function NoteList({ notes, onSelect, onToggleImportant }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune note pour l'instant — clique sur « + » pour en créer une.
      </p>
    )
  }

  return (
    <ul className="max-h-64 space-y-0.5 overflow-y-auto">
      {notes.map((note) => (
        <li key={note.id} className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelect(note.id)}
            className="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-left text-sm hover:bg-muted"
          >
            {(note.title ?? '').trim() || 'Sans titre'}
          </button>
          <button
            type="button"
            aria-label={note.important ? 'Retirer important' : 'Marquer important'}
            aria-pressed={note.important}
            onClick={() => onToggleImportant(note.id, !note.important)}
            className={cn(
              'shrink-0 rounded-md px-2 py-1 text-sm font-bold',
              note.important ? 'text-amber-500' : 'text-muted-foreground/30 hover:text-muted-foreground',
            )}
          >
            !
          </button>
        </li>
      ))}
    </ul>
  )
}
