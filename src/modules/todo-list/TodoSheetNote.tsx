import { useLiveQuery } from 'dexie-react-hooks'
import { Star, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { db } from '@/lib/db'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import { TodoPaper } from './TodoPaper'
import type { TodoSheet } from './types'

interface TodoSheetNoteProps {
  sheetId: string
}

// Fiche détachée du bloc : un node React Flow indépendant, dragable et
// supprimable — comme un post-it détaché, sauf qu'elle n'est plus éditable
// (cf. TodoListWidget) : cliquer une ligne la barre/coche, même convention
// que ChecklistWidget (isItem -> rayé, sinon grisé + coché).
export function TodoSheetNote({ sheetId }: TodoSheetNoteProps) {
  const sheet = useLiveQuery(() => db.todoSheets.get(sheetId), [sheetId])
  if (!sheet) return null
  return <TodoSheetNoteLoaded sheet={sheet} />
}

function TodoSheetNoteLoaded({ sheet }: { sheet: TodoSheet }) {
  const { t } = useTranslation()
  const handleToggleLine = (lineId: string) => {
    db.todoSheets.update(sheet.id, {
      lines: sheet.lines.map((line) => (line.id === lineId ? { ...line, done: !line.done } : line)),
    })
  }

  const handleDelete = () => {
    if (!confirm(t('todoList.confirmDelete'))) return
    db.todoSheets.delete(sheet.id)
  }

  const handleToggleImportant = () => db.todoSheets.update(sheet.id, { important: !sheet.important })

  return (
    <div className="relative w-64">
      <ToolbarButton
        onClick={handleToggleImportant}
        aria-label={t(sheet.important ? 'common.important.remove' : 'common.important.add')}
        aria-pressed={sheet.important}
        size="icon-sm"
        className="nodrag absolute -top-3 -left-3 z-10 rounded-full border bg-card shadow-md"
      >
        <Star className={cn('size-3.5', sheet.important && 'fill-amber-500 text-amber-500')} />
      </ToolbarButton>
      <ToolbarButton
        onClick={handleDelete}
        aria-label={t('todoList.deleteSheet')}
        size="icon-sm"
        className="nodrag absolute -top-3 -right-3 z-10 rounded-full border bg-card shadow-md"
      >
        <Trash2 className="size-3.5" />
      </ToolbarButton>
      <TodoPaper className="shadow-md">
        <div className="nodrag px-3">
          {sheet.lines.map((line) => (
            <div
              key={line.id}
              onClick={() => handleToggleLine(line.id)}
              className={cn(
                'h-[28px] cursor-pointer truncate leading-[28px]',
                line.isItem && line.done && 'text-muted-foreground line-through',
                !line.isItem && line.done && 'text-muted-foreground',
              )}
            >
              {!line.isItem && line.done ? `${line.text} ✓` : line.text}
            </div>
          ))}
        </div>
      </TodoPaper>
    </div>
  )
}
