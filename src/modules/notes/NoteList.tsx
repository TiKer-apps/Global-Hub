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
    // ~5 lignes visibles (calé sur la hauteur d'une ligne + son espacement),
    // le reste scrolle. `nowheel` : sans ça, la molette est captée par le
    // zoom du canvas React Flow plutôt que de scroller la liste.
    <ul className="nowheel max-h-[150px] space-y-0.5 overflow-y-auto">
      {notes.map((note) => (
        <li
          key={note.id}
          className={cn(
            'flex items-center gap-1 rounded-md',
            note.important ? 'important-surface hover:bg-orange-400' : 'hover:bg-muted',
          )}
        >
          <button
            type="button"
            onClick={() => onSelect(note.id)}
            className="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-left text-sm"
          >
            {(note.title ?? '').trim() || 'Sans titre'}
          </button>
          <button
            type="button"
            aria-label={note.important ? 'Retirer important' : 'Marquer important'}
            aria-pressed={note.important}
            onClick={() => onToggleImportant(note.id, !note.important)}
            className={cn(
              'mr-1 shrink-0 text-sm font-bold',
              note.important
                ? 'flex size-5 items-center justify-center rounded bg-white text-amber-500'
                : 'rounded-md px-2 py-1 text-muted-foreground/30',
            )}
          >
            !
          </button>
        </li>
      ))}
    </ul>
  )
}
