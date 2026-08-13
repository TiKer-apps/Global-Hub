import type { ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { useReactFlow } from '@xyflow/react'
import { ModuleCard } from '@/components/module-card'
import { db } from '@/lib/db'
import { useModuleNavigation } from '@/canvas/module-navigation'
import { useModuleHeaderClassName } from '@/canvas/module-theme'
import { useModuleStyleId } from '@/canvas/module-style'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </div>
  )
}

function stripHtml(html: string, fallback: string): string {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() || fallback
}

// IndexedDB n'accepte pas les booléens comme clé d'index valide (les
// enregistrements avec une valeur non indexable sont silencieusement exclus
// de l'index) : on lit toute la table et on filtre en mémoire plutôt que de
// se fier à `.where('important')`, peu fiable sur un champ booléen.
export function ImportantWidget() {
  const { t } = useTranslation()
  const headerClassName = useModuleHeaderClassName('important-1', 'orange-300')
  const headerStyle = useModuleStyleId('important-1', 'wave')
  const importantNotes =
    useLiveQuery(() => db.notes.toArray().then((notes) => notes.filter((n) => n.important)), []) ?? []
  const importantTasks =
    useLiveQuery(() => db.tasks.toArray().then((tasks) => tasks.filter((t) => t.important)), []) ?? []
  const importantEvents =
    useLiveQuery(() => db.events.toArray().then((events) => events.filter((e) => e.important)), []) ?? []
  const importantPostIts =
    useLiveQuery(() => db.postIts.toArray().then((postIts) => postIts.filter((p) => p.important)), []) ?? []
  const importantTodoSheets =
    useLiveQuery(() => db.todoSheets.toArray().then((sheets) => sheets.filter((s) => s.important)), []) ?? []
  const { requestOpen } = useModuleNavigation()
  const { fitView } = useReactFlow()

  // Post-its et fiches todo-list détachés sont des nodes React Flow
  // autonomes, pas des items d'un widget avec un état de sélection à faire
  // basculer (contrairement à notes/tâches/planning) : chaque node EST
  // l'item, "l'ouvrir" signifie recentrer le canvas dessus. No-op silencieux
  // si le node ciblé n'est pas monté (masqué via le drawer) — même limite
  // déjà acceptée pour notes/tâches (pas de pan si le widget est hors écran).
  const focusNode = (id: string) => fitView({ nodes: [{ id }], duration: 300, maxZoom: 1 })

  const hasAny =
    importantNotes.length > 0 ||
    importantTasks.length > 0 ||
    importantEvents.length > 0 ||
    importantPostIts.length > 0 ||
    importantTodoSheets.length > 0

  return (
    <ModuleCard
      className="w-72"
      title={t('important.title')}
      headerClassName={headerClassName}
      variant={headerStyle}
      contentClassName="space-y-3"
    >
      {!hasAny ? (
        <p className="text-sm text-muted-foreground">{t('important.empty')}</p>
      ) : (
        <>
          {importantNotes.length > 0 && (
            <Section title={t('important.sections.notes')}>
              <ul className="nowheel max-h-40 space-y-0.5 overflow-y-auto">
                {importantNotes.map((note) => (
                  <li key={note.id}>
                    <button
                      type="button"
                      onClick={() => requestOpen('notes', note.id)}
                      className="w-full truncate rounded-md px-2 py-1 text-left text-sm hover:bg-muted"
                    >
                      {(note.title ?? '').trim() || t('common.noTitle')}
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {importantTasks.length > 0 && (
            <Section title={t('important.sections.tasks')}>
              <ul className="nowheel max-h-40 space-y-0.5 overflow-y-auto">
                {importantTasks.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => requestOpen('tasks', task.id)}
                      className="w-full truncate rounded-md px-2 py-1 text-left text-sm hover:bg-muted"
                    >
                      {(task.title ?? '').trim() || t('common.noTitle')}
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {importantEvents.length > 0 && (
            <Section title={t('important.sections.events')}>
              <ul className="nowheel max-h-40 space-y-0.5 overflow-y-auto">
                {importantEvents.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => requestOpen('planning', event.id)}
                      className="w-full truncate rounded-md px-2 py-1 text-left text-sm hover:bg-muted"
                    >
                      {event.title.trim() || t('common.noTitle')}
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {importantPostIts.length > 0 && (
            <Section title={t('important.sections.postIts')}>
              <ul className="nowheel max-h-40 space-y-0.5 overflow-y-auto">
                {importantPostIts.map((postIt) => (
                  <li key={postIt.id}>
                    <button
                      type="button"
                      onClick={() => focusNode(postIt.id)}
                      className="w-full truncate rounded-md px-2 py-1 text-left text-sm hover:bg-muted"
                    >
                      {stripHtml(postIt.html, t('common.noTitle'))}
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {importantTodoSheets.length > 0 && (
            <Section title={t('important.sections.todoList')}>
              <ul className="nowheel max-h-40 space-y-0.5 overflow-y-auto">
                {importantTodoSheets.map((sheet) => (
                  <li key={sheet.id}>
                    <button
                      type="button"
                      onClick={() => focusNode(sheet.id)}
                      className="w-full truncate rounded-md px-2 py-1 text-left text-sm hover:bg-muted"
                    >
                      {sheet.lines[0]?.text.trim() || t('common.noTitle')}
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}
    </ModuleCard>
  )
}
