import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownNarrowWide, ArrowUpNarrowWide, List, NotebookPen, Plus } from 'lucide-react'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import { ToolbarDivider } from '@/modules/text-editor/ToolbarDivider'
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

  // Sans sélection, le titre/contenu tapés restent un brouillon local, non
  // persisté — seulement commité comme nouvelle note s'il n'est pas vide, au
  // moment de quitter la vue éditeur (retour liste ou nouvelle note).
  const commitDraftIfNeeded = () => {
    if (selectedId) return
    const hasContent = draftTitle.trim() !== '' || (draftHtml !== '' && draftHtml !== '<p></p>')
    if (!hasContent) return
    const now = new Date().toISOString()
    db.notes.add({
      id: crypto.randomUUID(),
      title: draftTitle,
      html: draftHtml,
      important: false,
      createdAt: now,
      updatedAt: now,
    })
    setDraftTitle('')
    setDraftHtml('')
  }

  const handleShowList = () => {
    commitDraftIfNeeded()
    setView('list')
  }

  const handleSelect = (id: string) => {
    commitDraftIfNeeded()
    setSelectedId(id)
    setView('editor')
  }

  const handleNewNote = () => {
    commitDraftIfNeeded()
    setSelectedId(null)
    setDraftTitle('')
    setDraftHtml('')
    setView('editor')
  }

  const handleToggleImportant = (id: string, important: boolean) => {
    db.notes.update(id, { important })
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
          <ToolbarButton active={view === 'list'} onClick={handleShowList} aria-label="Voir la liste">
            <List className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton active={view === 'editor'} onClick={() => setView('editor')} aria-label="Voir l'éditeur">
            <NotebookPen className="size-3.5" />
          </ToolbarButton>
          {view === 'list' && (
            <>
              <ToolbarDivider />
              <ToolbarButton onClick={handleNewNote} aria-label="Nouvelle note">
                <Plus className="size-3.5" />
              </ToolbarButton>
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
