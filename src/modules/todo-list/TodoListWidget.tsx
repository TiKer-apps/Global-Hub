import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNodeId, useReactFlow } from '@xyflow/react'
import { EditorContent } from '@tiptap/react'
import { SquareArrowOutUpRight } from 'lucide-react'
import { ModuleCard } from '@/components/module-card'
import { db } from '@/lib/db'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import { StyleToolbar } from '@/modules/text-editor/StyleToolbar'
import { useRichTextEditor } from '@/modules/text-editor/useRichTextEditor'
import type { ChecklistLine } from '@/modules/checklist/types'
import { TodoPaper } from './TodoPaper'

const isEmptyHtml = (html: string) => !html || html === '<p></p>'

// Une ligne du brouillon = un paragraphe Tiptap ; la mise en forme riche ne
// suit pas au détachement (la fiche n'est plus éditable, cf. TodoSheetNote),
// seul le texte brut est gardé — même convention que ChecklistWidget :
// ligne commençant par '-' -> item cochable/rayable au clic.
function parseDraftLines(html: string): ChecklistLine[] {
  const paragraphs = new DOMParser().parseFromString(html, 'text/html').body.children
  return [...paragraphs]
    .map((p) => (p.textContent ?? '').trim())
    .filter((text) => text !== '')
    .map((text) => {
      const isItem = text.startsWith('-')
      return {
        id: crypto.randomUUID(),
        text: isItem ? text.slice(1).trim() : text,
        isItem,
        done: false,
      }
    })
}

// Le bloc : un brouillon local (pas persisté) rédigé sur la feuille, qu'on
// détache ensuite — devient une vraie fiche (TodoSheet), rendue comme node
// indépendant par HubCanvas (voir TodoSheetNote.tsx). Contrairement au
// post-it, la fiche détachée n'est plus éditable une fois créée : seul le
// texte écrit ICI passe par l'éditeur riche.
export function TodoListWidget() {
  const [draftHtml, setDraftHtml] = useState('')
  const nodeId = useNodeId()
  const { getNode } = useReactFlow()
  const existingCount = useLiveQuery(() => db.todoSheets.count(), []) ?? 0

  const { editor, editorState, spellCheck, setSpellCheck } = useRichTextEditor(
    draftHtml,
    setDraftHtml,
    true,
    'Clique pour écrire…',
  )

  const handleDetach = () => {
    if (isEmptyHtml(draftHtml)) return
    const lines = parseDraftLines(draftHtml)
    if (lines.length === 0) return
    const padPosition = nodeId ? getNode(nodeId)?.position : undefined
    const jitter = (existingCount % 5) * 20
    const now = new Date().toISOString()
    db.todoSheets.add({
      id: crypto.randomUUID(),
      lines,
      important: false,
      createdAt: now,
      x: (padPosition?.x ?? 400) + jitter,
      y: (padPosition?.y ?? 300) + 260 + jitter,
    })
    editor?.commands.clearContent()
    setDraftHtml('')
  }

  return (
    <ModuleCard className="w-72" title="Todo-list" headerClassName="bg-red-500 text-white">
      <div className="flex flex-col items-center gap-2">
        {editor && editorState && (
          <StyleToolbar
            editor={editor}
            editorState={editorState}
            spellCheck={spellCheck}
            setSpellCheck={setSpellCheck}
            className="nodrag"
          />
        )}
        <TodoPaper>
          <EditorContent editor={editor} className="nodrag px-3" />
        </TodoPaper>
        <ToolbarButton onClick={handleDetach} disabled={isEmptyHtml(draftHtml)} aria-label="Détacher la fiche" size="sm">
          <SquareArrowOutUpRight className="size-3.5" />
          Détacher
        </ToolbarButton>
      </div>
    </ModuleCard>
  )
}
