import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNodeId, useReactFlow } from '@xyflow/react'
import { SquareArrowOutUpRight } from 'lucide-react'
import { ModuleCard } from '@/components/module-card'
import { db } from '@/lib/db'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import { POST_IT_FONTS, fontFamilyFor } from './fonts'
import type { PostItFont } from './types'

// Le bloc : un brouillon local (pas persisté) qu'on écrit directement sur le
// carré jaune, puis qu'on détache — à ce moment il devient un vrai
// enregistrement PostIt (voir PostItNote.tsx), rendu comme node indépendant
// par HubCanvas. Le bloc repart à vide, prêt pour la prochaine feuille.
export function PostItWidget() {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [draftFont, setDraftFont] = useState<PostItFont>('sans')
  const containerRef = useRef<HTMLDivElement>(null)
  const nodeId = useNodeId()
  const { getNode } = useReactFlow()
  const existingCount = useLiveQuery(() => db.postIts.count(), []) ?? 0

  useEffect(() => {
    if (!editing) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setEditing(false)
      }
    }
    // Capture (pas bubble) : React Flow stoppe la propagation de certains
    // clics (nodes, pane) pour son propre suivi de drag/sélection, ce qui
    // empêchait un listener en phase bulle de se déclencher.
    document.addEventListener('mousedown', handleClickOutside, true)
    return () => document.removeEventListener('mousedown', handleClickOutside, true)
  }, [editing])

  const handleDetach = () => {
    if (!draft.trim()) return
    const padPosition = nodeId ? getNode(nodeId)?.position : undefined
    const jitter = (existingCount % 5) * 20
    const now = new Date().toISOString()
    db.postIts.add({
      id: crypto.randomUUID(),
      html: draft,
      font: draftFont,
      important: false,
      createdAt: now,
      x: (padPosition?.x ?? 720) + jitter,
      y: (padPosition?.y ?? 0) + 260 + jitter,
    })
    setDraft('')
    setDraftFont('sans')
    setEditing(false)
  }

  return (
    <ModuleCard className="w-64" title="Post-it" headerClassName="bg-yellow-400 text-black">
      <div ref={containerRef} className="flex flex-col items-center gap-2">
        <div className="nodrag flex items-center gap-1">
          {POST_IT_FONTS.map((f) => (
            <ToolbarButton
              key={f.value}
              size="sm"
              active={draftFont === f.value}
              onClick={() => setDraftFont(f.value)}
              aria-label={f.label}
              style={{ fontFamily: f.fontFamily }}
            >
              Aa
            </ToolbarButton>
          ))}
        </div>
        <div
          onClick={() => setEditing(true)}
          className="flex size-32 cursor-pointer items-center justify-center bg-yellow-200 p-3 text-sm shadow-md"
          style={{ fontFamily: fontFamilyFor(draftFont) }}
        >
          {editing ? (
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Écris ta note…"
              className="nodrag size-full resize-none bg-transparent text-center outline-none placeholder:text-muted-foreground"
            />
          ) : (
            <span className="text-center whitespace-pre-wrap text-muted-foreground">
              {draft || 'Clique pour écrire'}
            </span>
          )}
        </div>
        <ToolbarButton onClick={handleDetach} disabled={!draft.trim()} aria-label="Détacher le post-it" size="sm">
          <SquareArrowOutUpRight className="size-3.5" />
          Détacher
        </ToolbarButton>
      </div>
    </ModuleCard>
  )
}
