import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNodeId, useReactFlow } from '@xyflow/react'
import { ArrowDownNarrowWide, ArrowLeft, ArrowUpNarrowWide, Plus, Save, Sticker, Trash2 } from 'lucide-react'
import { ModuleCard } from '@/components/module-card'
import { db } from '@/lib/db'
import { useModuleNavigation } from '@/canvas/module-navigation'
import { useModuleHeaderClassName } from '@/canvas/module-theme'
import { useModuleStyleId } from '@/canvas/module-style'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import { RichTextEditor } from '@/modules/text-editor/RichTextEditor'
import type { Note } from './types'
import { NoteList } from './NoteList'

const SAVE_DEBOUNCE_MS = 400

type View = 'list' | 'editor'
type SortField = 'createdAt' | 'updatedAt'
type SortDir = 'asc' | 'desc'

export function NotesWidget() {
  const headerClassName = useModuleHeaderClassName('notes-1', 'blue-300')
  const headerStyle = useModuleStyleId('notes-1', 'wave')
  const [view, setView] = useState<View>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftHtml, setDraftHtml] = useState('')
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const nodeId = useNodeId()
  const { getNode } = useReactFlow()
  const postItCount = useLiveQuery(() => db.postIts.count(), []) ?? 0

  const notes = useLiveQuery(() => {
    const collection = db.notes.orderBy(sortField)
    return (sortDir === 'desc' ? collection.reverse() : collection).toArray()
  }, [sortField, sortDir]) ?? []
  const selectedNote = useLiveQuery(
    () => (selectedId ? db.notes.get(selectedId) : undefined),
    [selectedId],
  )

  // Une entrée par note : changer de note (ou taper titre puis contenu) ne
  // doit pas annuler/écraser la sauvegarde en attente d'une autre note ou
  // d'un autre champ.
  const pendingPatches = useRef(new Map<string, Partial<Pick<Note, 'title' | 'html'>>>())
  const saveTimeouts = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  useEffect(() => () => saveTimeouts.current.forEach(clearTimeout), [])

  const scheduleSave = (id: string, patch: Partial<Pick<Note, 'title' | 'html'>>) => {
    pendingPatches.current.set(id, { ...pendingPatches.current.get(id), ...patch })
    clearTimeout(saveTimeouts.current.get(id))
    saveTimeouts.current.set(
      id,
      setTimeout(() => {
        const finalPatch = pendingPatches.current.get(id)
        pendingPatches.current.delete(id)
        saveTimeouts.current.delete(id)
        if (finalPatch) db.notes.update(id, { ...finalPatch, updatedAt: new Date().toISOString() })
      }, SAVE_DEBOUNCE_MS),
    )
  }

  const hasDraftContent = draftTitle.trim() !== '' || (draftHtml !== '' && draftHtml !== '<p></p>')

  // Sans sélection, le titre/contenu tapés restent un brouillon local, non
  // persisté — commité comme nouvelle note s'il n'est pas vide, soit
  // explicitement (bouton Enregistrer), soit implicitement en quittant la
  // vue éditeur (retour liste ou nouvelle note), en filet de sécurité.
  const commitDraft = (): string | null => {
    if (selectedId || !hasDraftContent) return null
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    db.notes.add({
      id,
      title: draftTitle,
      html: draftHtml,
      important: false,
      createdAt: now,
      updatedAt: now,
    })
    setDraftTitle('')
    setDraftHtml('')
    return id
  }

  const handleShowList = () => {
    commitDraft()
    setView('list')
  }

  const handleSelect = (id: string) => {
    commitDraft()
    setSelectedId(id)
    setView('editor')
  }

  // Un autre widget (Important) peut demander l'ouverture d'une note
  // précise sans connaître directement ce composant.
  const { request, consumeOpenRequest } = useModuleNavigation()
  useEffect(() => {
    if (request?.module !== 'notes') return
    handleSelect(request.id)
    consumeOpenRequest()
  }, [request])

  const handleNewNote = () => {
    commitDraft()
    setSelectedId(null)
    setDraftTitle('')
    setDraftHtml('')
    setView('editor')
  }

  // Valide explicitement le brouillon en cours : la note devient réelle et
  // reste ouverte dans l'éditeur (sauvegarde live comme toute note existante).
  const handleSaveDraft = () => {
    const id = commitDraft()
    if (id) setSelectedId(id)
  }

  const handleToggleImportant = (id: string, important: boolean) => {
    db.notes.update(id, { important })
  }

  // Supprime la note actuellement ouverte dans l'éditeur (bouton dédié,
  // n'a de sens que là — rien à supprimer depuis un brouillon non enregistré).
  const handleDeleteCurrentNote = () => {
    if (!selectedId) return
    if (!confirm('Supprimer cette note ?')) return
    db.notes.delete(selectedId)
    setSelectedId(null)
    setView('list')
  }

  const toggleSortDir = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))

  const handleTitleChange = (title: string) => {
    if (selectedId) {
      scheduleSave(selectedId, { title })
    } else {
      setDraftTitle(title)
    }
  }

  const handleContentChange = (html: string) => {
    if (selectedId) {
      scheduleSave(selectedId, { html })
    } else {
      setDraftHtml(html)
    }
  }

  const title = selectedId ? (selectedNote?.title ?? '') : draftTitle
  const content = selectedId ? (selectedNote?.html ?? '') : draftHtml

  // Reprend le contenu courant (brouillon ou note sélectionnée) tel quel
  // dans un nouveau post-it détaché, sans dépendre de l'état de sauvegarde
  // de la note elle-même.
  const handleCreatePostIt = () => {
    if (!content || content === '<p></p>') return
    const notesPosition = nodeId ? getNode(nodeId)?.position : undefined
    const jitter = (postItCount % 5) * 20
    const now = new Date().toISOString()
    db.postIts.add({
      id: crypto.randomUUID(),
      html: content,
      important: false,
      createdAt: now,
      x: (notesPosition?.x ?? 400) + jitter,
      y: (notesPosition?.y ?? 0) + 260 + jitter,
    })
  }

  return (
    <ModuleCard
      className="w-80"
      title="Notes"
      headerClassName={headerClassName}
      variant={headerStyle}
      action={
        view === 'list' ? (
          <ToolbarButton onClick={handleNewNote} aria-label="Nouvelle note">
            <Plus className="size-3.5" />
          </ToolbarButton>
        ) : (
          <>
            <ToolbarButton onClick={handleShowList} aria-label="Retour à la liste">
              <ArrowLeft className="size-3.5" />
            </ToolbarButton>
            {selectedId ? (
              <ToolbarButton onClick={handleDeleteCurrentNote} aria-label="Supprimer la note">
                <Trash2 className="size-3.5" />
              </ToolbarButton>
            ) : (
              <ToolbarButton onClick={handleSaveDraft} disabled={!hasDraftContent} aria-label="Enregistrer la note">
                <Save className="size-3.5" />
              </ToolbarButton>
            )}
          </>
        )
      }
    >
      {view === 'list' ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              aria-label="Trier par"
              className="h-7 rounded-md border bg-background px-1.5 text-xs"
            >
              <option value="createdAt">Date de création</option>
              <option value="updatedAt">Date de modification</option>
            </select>
            <ToolbarButton onClick={toggleSortDir} aria-label="Inverser l'ordre du tri">
              {sortDir === 'desc' ? (
                <ArrowDownNarrowWide className="size-3.5" />
              ) : (
                <ArrowUpNarrowWide className="size-3.5" />
              )}
            </ToolbarButton>
          </div>
          <NoteList notes={notes} onSelect={handleSelect} onToggleImportant={handleToggleImportant} />
        </div>
      ) : selectedId && selectedNote?.id !== selectedId ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-1 border-b pb-1.5">
            <input
              key={`title-${selectedId ?? 'draft'}`}
              type="text"
              autoComplete="off"
              defaultValue={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Titre"
              className="min-w-0 flex-1 bg-transparent px-1 text-sm font-medium outline-none placeholder:text-muted-foreground placeholder:font-normal"
            />
            <ToolbarButton
              onClick={handleCreatePostIt}
              disabled={!content || content === '<p></p>'}
              aria-label="Créer un post-it à partir de cette note"
            >
              <Sticker className="size-3.5" />
            </ToolbarButton>
          </div>
          <RichTextEditor key={`editor-${selectedId ?? 'draft'}`} content={content} onChange={handleContentChange} />
        </div>
      )}
    </ModuleCard>
  )
}
