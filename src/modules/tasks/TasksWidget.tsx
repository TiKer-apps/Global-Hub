import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownNarrowWide, ArrowLeft, ArrowUpNarrowWide, Plus, Save, Trash2 } from 'lucide-react'
import { ModuleCard } from '@/components/module-card'
import { db } from '@/lib/db'
import { useModuleNavigation } from '@/canvas/module-navigation'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import type { Task } from './types'
import { TaskList } from './TaskList'
import { TaskPreview } from './TaskPreview'

const SAVE_DEBOUNCE_MS = 400

type View = 'list' | 'editor'
type SortField = 'createdAt' | 'updatedAt'
type SortDir = 'asc' | 'desc'

// Même architecture que NotesWidget (liste/éditeur, brouillon local tant que
// rien n'est sélectionné, sauvegarde debouncée par champ) — seule différence
// notable : le contenu est un texte brut (pas de RichTextEditor), doublé
// d'un aperçu en direct (TaskPreview) qui rend les lignes '-' en cases à
// cocher, cf. TaskPreview.
export function TasksWidget() {
  const [view, setView] = useState<View>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  // Reflète la valeur du textarea à chaque frappe, tâche existante ou
  // brouillon confondus — pilote l'aperçu indépendamment de la sauvegarde
  // debouncée vers Dexie (sinon l'aperçu resterait en retard le temps du
  // debounce + de la relecture de la live query).
  const [liveContent, setLiveContent] = useState('')
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const tasks = useLiveQuery(() => {
    const collection = db.tasks.orderBy(sortField)
    return (sortDir === 'desc' ? collection.reverse() : collection).toArray()
  }, [sortField, sortDir]) ?? []
  const selectedTask = useLiveQuery(() => (selectedId ? db.tasks.get(selectedId) : undefined), [selectedId])

  const pendingPatches = useRef(new Map<string, Partial<Pick<Task, 'title' | 'content'>>>())
  const saveTimeouts = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  useEffect(() => () => saveTimeouts.current.forEach(clearTimeout), [])

  const scheduleSave = (id: string, patch: Partial<Pick<Task, 'title' | 'content'>>) => {
    pendingPatches.current.set(id, { ...pendingPatches.current.get(id), ...patch })
    clearTimeout(saveTimeouts.current.get(id))
    saveTimeouts.current.set(
      id,
      setTimeout(() => {
        const finalPatch = pendingPatches.current.get(id)
        pendingPatches.current.delete(id)
        saveTimeouts.current.delete(id)
        if (finalPatch) db.tasks.update(id, { ...finalPatch, updatedAt: new Date().toISOString() })
      }, SAVE_DEBOUNCE_MS),
    )
  }

  const hasDraftContent = draftTitle.trim() !== '' || draftContent.trim() !== ''

  const commitDraft = (): string | null => {
    if (selectedId || !hasDraftContent) return null
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    db.tasks.add({
      id,
      title: draftTitle,
      content: draftContent,
      important: false,
      createdAt: now,
      updatedAt: now,
    })
    setDraftTitle('')
    setDraftContent('')
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

  // Un autre widget (Important) peut demander l'ouverture d'une tâche
  // précise sans connaître directement ce composant.
  const { request, consumeOpenRequest } = useModuleNavigation()
  useEffect(() => {
    if (request?.module !== 'tasks') return
    handleSelect(request.id)
    consumeOpenRequest()
  }, [request])

  const handleNewTask = () => {
    commitDraft()
    setSelectedId(null)
    setDraftTitle('')
    setDraftContent('')
    setView('editor')
  }

  const handleSaveDraft = () => {
    const id = commitDraft()
    if (id) setSelectedId(id)
  }

  const handleToggleImportant = (id: string, important: boolean) => {
    db.tasks.update(id, { important })
  }

  const handleDeleteCurrentTask = () => {
    if (!selectedId) return
    if (!confirm('Supprimer cette tâche ?')) return
    db.tasks.delete(selectedId)
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

  const handleContentChange = (content: string) => {
    setLiveContent(content)
    if (selectedId) {
      scheduleSave(selectedId, { content })
    } else {
      setDraftContent(content)
    }
  }

  const title = selectedId ? (selectedTask?.title ?? '') : draftTitle
  const content = selectedId ? (selectedTask?.content ?? '') : draftContent

  // Resynchronise l'aperçu quand on change de tâche ouverte (pas à chaque
  // frappe : ensuite `handleContentChange` prend le relais directement).
  useEffect(() => {
    setLiveContent(content)
  }, [selectedId, selectedTask?.id])

  return (
    <ModuleCard
      className="w-80"
      title="Tâches"
      headerClassName="bg-violet-500 text-white"
      action={
        view === 'list' ? (
          <ToolbarButton onClick={handleNewTask} aria-label="Nouvelle tâche">
            <Plus className="size-3.5" />
          </ToolbarButton>
        ) : (
          <>
            <ToolbarButton onClick={handleShowList} aria-label="Retour à la liste">
              <ArrowLeft className="size-3.5" />
            </ToolbarButton>
            {selectedId ? (
              <ToolbarButton onClick={handleDeleteCurrentTask} aria-label="Supprimer la tâche">
                <Trash2 className="size-3.5" />
              </ToolbarButton>
            ) : (
              <ToolbarButton onClick={handleSaveDraft} disabled={!hasDraftContent} aria-label="Enregistrer la tâche">
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
          <TaskList tasks={tasks} onSelect={handleSelect} onToggleImportant={handleToggleImportant} />
        </div>
      ) : selectedId && selectedTask?.id !== selectedId ? (
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
            className="w-full border-b bg-transparent px-1 pb-1.5 text-sm font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground"
          />
          <textarea
            key={`content-${selectedId ?? 'draft'}`}
            defaultValue={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={'- item à cocher\nTexte simple'}
            rows={5}
            className="nodrag w-full resize-none rounded-md border bg-background p-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <TaskPreview content={liveContent} />
        </div>
      )}
    </ModuleCard>
  )
}
