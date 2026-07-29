import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface NotesNavigationContextValue {
  requestedNoteId: string | null
  requestOpenNote: (id: string) => void
  consumeOpenRequest: () => void
}

const NotesNavigationContext = createContext<NotesNavigationContextValue | null>(null)

// Coordination minimale entre widgets indépendants du canvas : permet à un
// autre module (ex. Important) de demander au widget Notes d'ouvrir une note
// précise, sans que les deux composants se connaissent directement.
export function NotesNavigationProvider({ children }: { children: ReactNode }) {
  const [requestedNoteId, setRequestedNoteId] = useState<string | null>(null)

  const value = useMemo<NotesNavigationContextValue>(
    () => ({
      requestedNoteId,
      requestOpenNote: setRequestedNoteId,
      consumeOpenRequest: () => setRequestedNoteId(null),
    }),
    [requestedNoteId],
  )

  return <NotesNavigationContext.Provider value={value}>{children}</NotesNavigationContext.Provider>
}

export function useNotesNavigation() {
  const ctx = useContext(NotesNavigationContext)
  if (!ctx) throw new Error('useNotesNavigation must be used within NotesNavigationProvider')
  return ctx
}
