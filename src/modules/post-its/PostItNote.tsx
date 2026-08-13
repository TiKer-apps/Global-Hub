import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { EditorContent } from '@tiptap/react'
import { Star, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { db } from '@/lib/db'
import { cn } from '@/lib/utils'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import { StyleToolbar } from '@/modules/text-editor/StyleToolbar'
import { useRichTextEditor } from '@/modules/text-editor/useRichTextEditor'
import type { PostIt } from './types'

const SAVE_DEBOUNCE_MS = 400

interface PostItNoteProps {
  postItId: string
}

// Post-it détaché du bloc : un node React Flow indépendant et dragable.
// Le contenu ne doit être passé à l'éditeur qu'une fois chargé (Tiptap ne
// prend `content` qu'à l'initialisation) — d'où le composant intermédiaire
// qui ne monte l'éditeur qu'une fois `postIt` disponible.
export function PostItNote({ postItId }: PostItNoteProps) {
  const postIt = useLiveQuery(() => db.postIts.get(postItId), [postItId])
  if (!postIt) return null
  return <PostItNoteLoaded postIt={postIt} />
}

// `nodrag` n'est posé que pendant l'édition (sinon on ne pourrait jamais le
// déplacer en le saisissant directement, comme un vrai post-it).
function PostItNoteLoaded({ postIt }: { postIt: PostIt }) {
  const { t } = useTranslation()
  const [active, setActive] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleTextChange = (html: string) => {
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      db.postIts.update(postIt.id, { html })
    }, SAVE_DEBOUNCE_MS)
  }

  const { editor, editorState, spellCheck, setSpellCheck } = useRichTextEditor(
    postIt.html,
    handleTextChange,
    active,
    t('postIts.placeholderEmpty'),
  )

  useEffect(() => {
    if (!active) return
    // Capture (pas bubble) : React Flow stoppe la propagation de certains
    // clics (nodes, pane) pour son propre suivi de drag/sélection, ce qui
    // empêchait un listener en phase bulle de se déclencher.
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActive(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside, true)
    return () => document.removeEventListener('mousedown', handleClickOutside, true)
  }, [active])

  useEffect(() => () => clearTimeout(saveTimeout.current), [])

  if (!editor || !editorState) return null

  const handleDelete = () => {
    if (!confirm(t('postIts.confirmDelete'))) return
    db.postIts.delete(postIt.id)
  }

  const handleToggleImportant = () => db.postIts.update(postIt.id, { important: !postIt.important })

  return (
    <div ref={containerRef} className={cn('relative', active && 'nodrag')}>
      {active && (
        <StyleToolbar
          editor={editor}
          editorState={editorState}
          spellCheck={spellCheck}
          setSpellCheck={setSpellCheck}
          className="nodrag absolute -top-14 left-1/2 z-10 w-max -translate-x-1/2 flex-nowrap rounded-md border bg-card px-1 py-1 shadow-md"
          extra={
            <>
              <ToolbarButton
                onClick={handleToggleImportant}
                aria-label={t(postIt.important ? 'common.important.remove' : 'common.important.add')}
                aria-pressed={postIt.important}
              >
                <Star className={cn('size-3.5', postIt.important && 'fill-amber-500 text-amber-500')} />
              </ToolbarButton>
              <ToolbarButton onClick={handleDelete} aria-label={t('postIts.deletePostIt')}>
                <Trash2 className="size-3.5" />
              </ToolbarButton>
            </>
          }
        />
      )}
      <div
        onClick={() => setActive(true)}
        className="size-40 cursor-pointer overflow-hidden bg-yellow-200 p-3 text-sm shadow-md"
      >
        <EditorContent editor={editor} className="size-full" />
      </div>
      {/* Indicateur passif : la toolbar (donc l'état "rempli" de l'étoile)
          n'est visible qu'en édition, sans ça rien ne signale un post-it
          important tant qu'on ne clique pas dessus. */}
      {postIt.important && !active && (
        <Star className="pointer-events-none absolute top-1 right-1 size-3.5 fill-amber-500 text-amber-500" />
      )}
    </div>
  )
}
