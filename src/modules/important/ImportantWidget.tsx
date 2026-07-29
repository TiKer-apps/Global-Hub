import type { ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card className="w-72">
      {/* -mt : le Card parent n'a de padding que vertical (--card-spacing) —
          sans compenser par une marge négative, le fond de l'en-tête n'atteint
          jamais le haut de la carte. Pas de padding horizontal sur Card, donc
          rien à compenser côté mx/px (CardHeader garde le sien tel quel). */}
      <CardHeader className="important-surface -mt-4 rounded-t-xl pt-4">
        <CardTitle>Important</CardTitle>
      </CardHeader>
      <CardContent className="nodrag space-y-3">
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
      </CardContent>
    </Card>
  )
}
