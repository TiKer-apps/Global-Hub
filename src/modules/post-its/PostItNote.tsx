import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import { cn } from '@/lib/utils'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import { ToolbarDivider } from '@/modules/text-editor/ToolbarDivider'
import { POST_IT_FONTS, fontFamilyFor } from './fonts'

const SAVE_DEBOUNCE_MS = 400

interface PostItNoteProps {
  postItId: string
}

// Post-it détaché du bloc : un node React Flow indépendant et dragable.
// `nodrag` n'est posé que pendant l'édition (sinon on ne pourrait jamais le
// déplacer en le saisissant directement, comme un vrai post-it).
export function PostItNote({ postItId }: PostItNoteProps) {
  const postIt = useLiveQuery(() => db.postIts.get(postItId), [postItId])
  const [active, setActive] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!active) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActive(false)
      }
    }
    // Capture (pas bubble) : React Flow stoppe la propagation de certains
    // clics (nodes, pane) pour son propre suivi de drag/sélection, ce qui
    // empêchait un listener en phase bulle de se déclencher.
    document.addEventListener('mousedown', handleClickOutside, true)
    return () => document.removeEventListener('mousedown', handleClickOutside, true)
  }, [active])

  useEffect(() => () => clearTimeout(saveTimeout.current), [])

  if (!postIt) return null

  const handleTextChange = (html: string) => {
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      db.postIts.update(postItId, { html })
    }, SAVE_DEBOUNCE_MS)
  }

  const handleDelete = () => {
    if (!confirm('Supprimer ce post-it ?')) return
    db.postIts.delete(postItId)
  }

  return (
    <div ref={containerRef} className={cn('relative', active && 'nodrag')}>
      {active && (
        <div className="nodrag absolute -top-14 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-md border bg-card px-1 py-1 shadow-md">
          {POST_IT_FONTS.map((f) => (
            <ToolbarButton
              key={f.value}
              size="sm"
              active={postIt.font === f.value}
              onClick={() => db.postIts.update(postItId, { font: f.value })}
              aria-label={f.label}
              style={{ fontFamily: f.fontFamily }}
            >
              Aa
            </ToolbarButton>
          ))}
          <ToolbarDivider />
          <ToolbarButton onClick={handleDelete} aria-label="Supprimer le post-it">
            <Trash2 className="size-3.5" />
          </ToolbarButton>
        </div>
      )}
      <div
        onClick={() => setActive(true)}
        className="flex size-40 cursor-pointer flex-col bg-yellow-200 p-3 text-sm shadow-md"
        style={{ fontFamily: fontFamilyFor(postIt.font) }}
      >
        {active ? (
          <textarea
            autoFocus
            defaultValue={postIt.html}
            onChange={(e) => handleTextChange(e.target.value)}
            className="size-full resize-none bg-transparent outline-none"
          />
        ) : (
          <div className="size-full overflow-hidden whitespace-pre-wrap">
            {postIt.html || 'Post-it vide'}
          </div>
        )}
      </div>
    </div>
  )
}
