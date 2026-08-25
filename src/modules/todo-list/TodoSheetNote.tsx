import { useLiveQuery } from 'dexie-react-hooks'
import { Star, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { db } from '@/lib/db'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import type { TodoSheet } from './types'

interface TodoSheetNoteProps {
  sheetId: string
}

// Fiche détachée du bloc : un node React Flow indépendant, dragable et
// supprimable — comme un post-it détaché, sauf qu'elle n'est plus éditable
// (cf. TodoListWidget) : cliquer une case coche/décoche la ligne. Même
// liste plate (case à cocher + texte) que le brouillon, pour la même
// raison (cf. TodoListWidget.tsx) — plus de fond "papier"/quadrillage,
// qui coupait visuellement le texte et ne se lisait pas comme une
// checklist. `!isItem` (convention historique, avant simplification à un
// seul type de ligne cochable) est traité à l'identique : une case, pas
// de distinction visuelle, pas de migration nécessaire sur les données
// déjà en base.
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
      <div className="rounded-md border bg-card p-2 shadow-md">
        {/* `nodrag` posé ici (sur tout le conteneur de la liste), pas
            seulement sur chaque `<li>` : l'espace entre deux lignes
            (`space-y-0.5`, une marge) appartient au `<ul>` lui-même, pas
            aux `<li>` — sans ce `nodrag` sur le parent, ce petit espace
            retombait sur le comportement "drag" du node (curseur `grab`
            trompeur entre deux items). */}
        <ul className="nodrag nowheel max-h-[150px] space-y-0.5 overflow-y-auto">
          {sheet.lines.map((line) => (
            <li key={line.id} className="rounded-md hover:bg-muted">
              <label className="flex cursor-pointer items-center gap-2 px-1">
                <input
                  type="checkbox"
                  checked={line.done}
                  onChange={() => handleToggleLine(line.id)}
                  className="size-3.5 shrink-0"
                />
                <span className={cn('min-w-0 flex-1 truncate text-sm', line.done && 'text-muted-foreground line-through')}>
                  {line.text}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
