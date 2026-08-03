import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNodeId, useReactFlow } from '@xyflow/react'
import { EditorContent } from '@tiptap/react'
import { SquareArrowOutUpRight } from 'lucide-react'
import { ModuleCard } from '@/components/module-card'
import { useModuleHeaderClassName } from '@/canvas/module-theme'
import { useModuleStyleId } from '@/canvas/module-style'
import { db } from '@/lib/db'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import { StyleToolbar } from '@/modules/text-editor/StyleToolbar'
import { useRichTextEditor } from '@/modules/text-editor/useRichTextEditor'

const isEmptyHtml = (html: string) => !html || html === '<p></p>'

// Le bloc : un brouillon local (pas persisté) qu'on écrit directement sur le
// carré jaune, puis qu'on détache — à ce moment il devient un vrai
// enregistrement PostIt (voir PostItNote.tsx), rendu comme node indépendant
// par HubCanvas. Le bloc repart à vide, prêt pour la prochaine feuille.
// Toolbar toujours visible ici (pas de bascule affichage/édition comme sur
// un post-it détaché — c'est un widget fixe comme les autres).
export function PostItWidget() {
  const headerClassName = useModuleHeaderClassName('post-it-1', 'yellow-400')
  const headerStyle = useModuleStyleId('post-it-1', 'wave')
  const [draftHtml, setDraftHtml] = useState('')
  const nodeId = useNodeId()
  const { getNode } = useReactFlow()
  const existingCount = useLiveQuery(() => db.postIts.count(), []) ?? 0

  const { editor, editorState, spellCheck, setSpellCheck } = useRichTextEditor(
    draftHtml,
    setDraftHtml,
    true,
    'Clique pour écrire…',
  )

  const handleDetach = () => {
    if (isEmptyHtml(draftHtml)) return
    const padPosition = nodeId ? getNode(nodeId)?.position : undefined
    const jitter = (existingCount % 5) * 20
    const now = new Date().toISOString()
    db.postIts.add({
      id: crypto.randomUUID(),
      html: draftHtml,
      important: false,
      createdAt: now,
      x: (padPosition?.x ?? 720) + jitter,
      y: (padPosition?.y ?? 0) + 260 + jitter,
    })
    editor?.commands.clearContent()
    setDraftHtml('')
  }

  return (
    <ModuleCard className="w-64" title="Post-it" headerClassName={headerClassName} variant={headerStyle}>
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
        <EditorContent editor={editor} className="nodrag size-32 overflow-hidden bg-yellow-200 p-3 text-sm shadow-md" />
        <ToolbarButton
          onClick={handleDetach}
          disabled={isEmptyHtml(draftHtml)}
          aria-label="Détacher le post-it"
          size="sm"
        >
          <SquareArrowOutUpRight className="size-3.5" />
          Détacher
        </ToolbarButton>
      </div>
    </ModuleCard>
  )
}
