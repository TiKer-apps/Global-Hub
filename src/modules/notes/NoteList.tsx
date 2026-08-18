import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note } from './types'

interface NoteListProps {
  notes: Note[]
  onSelect: (id: string) => void
  onToggleImportant: (id: string, important: boolean) => void
}

export function NoteList({ notes, onSelect, onToggleImportant }: NoteListProps) {
  const { t } = useTranslation()
  if (notes.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('notes.emptyList')}</p>
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
            {(note.title ?? '').trim() || t('common.noTitle')}
          </button>
          <button
            type="button"
            aria-label={t(note.important ? 'common.important.remove' : 'common.important.add')}
            aria-pressed={note.important}
            onClick={() => onToggleImportant(note.id, !note.important)}
            className={cn(
              'mr-1 flex size-5 shrink-0 items-center justify-center rounded',
              note.important ? 'bg-white' : 'text-muted-foreground/30 hover:text-muted-foreground',
            )}
          >
            <Star className={cn('size-3.5', note.important && 'fill-amber-500 text-amber-500')} />
          </button>
        </li>
      ))}
    </ul>
  )
}
