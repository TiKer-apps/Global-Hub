import type { ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ModuleCard } from '@/components/module-card'
import { db } from '@/lib/db'
import { useNotesNavigation } from '@/canvas/notes-navigation'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </div>
  )
}

// IndexedDB n'accepte pas les booléens comme clé d'index valide (les
// enregistrements avec une valeur non indexable sont silencieusement exclus
// de l'index) : on lit toute la table et on filtre en mémoire plutôt que de
// se fier à `.where('important')`, peu fiable sur un champ booléen.
export function ImportantWidget() {
  const importantNotes =
    useLiveQuery(() => db.notes.toArray().then((notes) => notes.filter((n) => n.important)), []) ?? []
  const { requestOpenNote } = useNotesNavigation()

  // Rubriques par type de source — pour l'instant seules les notes existent
  // vraiment ; ajouter événements/tâches/todo-list plus tard = une query +
  // une Section de plus, même principe.
  const hasAny = importantNotes.length > 0

  return (
    <ModuleCard
      className="w-72"
      title="Important"
      headerClassName="bg-orange-300 text-white"
      contentClassName="space-y-3"
    >
      {!hasAny ? (
        <p className="text-sm text-muted-foreground">Rien de marqué important pour l'instant.</p>
      ) : (
        <Section title="Notes">
          <ul className="nowheel max-h-40 space-y-0.5 overflow-y-auto">
            {importantNotes.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => requestOpenNote(note.id)}
                  className="w-full truncate rounded-md px-2 py-1 text-left text-sm hover:bg-muted"
                >
                  {(note.title ?? '').trim() || 'Sans titre'}
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </ModuleCard>
  )
}
