import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownNarrowWide, ArrowLeft, ArrowUpNarrowWide, Plus, Save, Trash2 } from 'lucide-react'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db'
import { useNotesNavigation } from '@/canvas/notes-navigation'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import type { Note } from './types'
import { NoteEditor } from './NoteEditor'
import { NoteList } from './NoteList'

const SAVE_DEBOUNCE_MS = 400

type View = 'list' | 'editor'
type SortField = 'createdAt' | 'updatedAt'
type SortDir = 'asc' | 'desc'

export function NotesWidget() {
  const [view, setView] = useState<View>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftHtml, setDraftHtml] = useState('')
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

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
  const { requestedNoteId, consumeOpenRequest } = useNotesNavigation()
  useEffect(() => {
    if (!requestedNoteId) return
    handleSelect(requestedNoteId)
    consumeOpenRequest()
  }, [requestedNoteId])

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

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <CardAction className="nodrag flex items-center gap-1">
          {view === 'list' ? (
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
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="nodrag">
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
            <input
              key={`title-${selectedId ?? 'draft'}`}
              type="text"
              autoComplete="off"
              defaultValue={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Titre"
              className="w-full border-b bg-transparent px-1 pb-1.5 text-sm font-medium outline-none placeholder:text-muted-foreground placeholder:font-normal"
            />
            <NoteEditor key={`editor-${selectedId ?? 'draft'}`} content={content} onChange={handleContentChange} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
