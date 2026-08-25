import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { useNodeId, useReactFlow } from '@xyflow/react'
import { Plus, SquareArrowOutUpRight, X } from 'lucide-react'
import { ModuleCard } from '@/components/module-card'
import { useModuleHeaderClassName } from '@/canvas/module-theme'
import { useModuleStyleId } from '@/canvas/module-style'
import { cn } from '@/lib/utils'
import { db } from '@/lib/db'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import type { ChecklistLine } from '@/modules/checklist/types'

// Le bloc : une liste structurée rédigée directement (pas de texte libre à
// convertir au détachement, contrairement à l'ancienne version) — chaque
// ligne ajoutée est déjà un item cochable. Détacher pousse ces lignes en
// l'état dans une vraie fiche (TodoSheet), rendue comme node indépendant
// par HubCanvas (voir TodoSheetNote.tsx), qui elle n'est plus éditable.
export function TodoListWidget() {
  const { t } = useTranslation()
  const headerClassName = useModuleHeaderClassName('todo-1', 'red-500')
  const headerStyle = useModuleStyleId('todo-1', 'wave')
  const [items, setItems] = useState<ChecklistLine[]>([])
  const [inputValue, setInputValue] = useState('')
  const nodeId = useNodeId()
  const { getNode } = useReactFlow()
  const existingCount = useLiveQuery(() => db.todoSheets.count(), []) ?? 0

  const handleAdd = () => {
    const text = inputValue.trim()
    if (text === '') return
    setItems((prev) => [...prev, { id: crypto.randomUUID(), text, isItem: true, done: false }])
    setInputValue('')
  }

  const handleToggleDraftLine = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)))
  }

  const handleRemoveDraftLine = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleDetach = () => {
    if (items.length === 0) return
    const padPosition = nodeId ? getNode(nodeId)?.position : undefined
    const jitter = (existingCount % 5) * 20
    const now = new Date().toISOString()
    db.todoSheets.add({
      id: crypto.randomUUID(),
      lines: items,
      important: false,
      createdAt: now,
      x: (padPosition?.x ?? 400) + jitter,
      y: (padPosition?.y ?? 300) + 260 + jitter,
    })
    setItems([])
    setInputValue('')
  }

  return (
    <ModuleCard className="w-72" title={t('todoList.title')} headerClassName={headerClassName} variant={headerStyle}>
      <div className="flex flex-col items-center gap-2">
        <div className="flex w-full items-center gap-1 px-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              handleAdd()
            }}
            placeholder={t('todoList.itemPlaceholder')}
            aria-label={t('todoList.itemPlaceholder')}
            className="h-8 flex-1 rounded-sm border bg-background px-2 text-sm"
          />
          <ToolbarButton onClick={handleAdd} disabled={inputValue.trim() === ''} aria-label={t('todoList.addItem')} className="nodrag">
            <Plus className="size-3.5" />
          </ToolbarButton>
        </div>
        {items.length === 0 ? (
          <p className="w-full text-sm text-muted-foreground">{t('todoList.emptyDraft')}</p>
        ) : (
          // `nowheel` : sans ça la molette zoome le canvas React Flow au
          // lieu de scroller la liste — même pattern que `NoteList.tsx`.
          <ul className="nowheel w-full max-h-[150px] space-y-0.5 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-1 rounded-md hover:bg-muted">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 px-1">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => handleToggleDraftLine(item.id)}
                    className="size-3.5 shrink-0"
                  />
                  <span className={cn('min-w-0 flex-1 truncate py-1 text-sm', item.done && 'text-muted-foreground line-through')}>
                    {item.text}
                  </span>
                </label>
                <ToolbarButton
                  onClick={() => handleRemoveDraftLine(item.id)}
                  aria-label={t('todoList.removeItem', { text: item.text })}
                  size="icon-sm"
                  className="shrink-0"
                >
                  <X className="size-3" />
                </ToolbarButton>
              </li>
            ))}
          </ul>
        )}
        <ToolbarButton onClick={handleDetach} disabled={items.length === 0} aria-label={t('todoList.detachSheet')} size="sm">
          <SquareArrowOutUpRight className="size-3.5" />
          {t('postIts.detach')}
        </ToolbarButton>
      </div>
    </ModuleCard>
  )
}
