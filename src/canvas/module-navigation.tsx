import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type NavigableModule = 'notes' | 'tasks'

interface OpenRequest {
  module: NavigableModule
  id: string
}

interface ModuleNavigationContextValue {
  request: OpenRequest | null
  requestOpen: (module: NavigableModule, id: string) => void
  consumeOpenRequest: () => void
}

const ModuleNavigationContext = createContext<ModuleNavigationContextValue | null>(null)

// Coordination minimale entre widgets indépendants du canvas : permet à un
// autre module (ex. Important) de demander à un widget d'ouvrir un item
// précis (une note, une tâche...), sans que les deux composants se
// connaissent directement.
export function ModuleNavigationProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<OpenRequest | null>(null)

  const value = useMemo<ModuleNavigationContextValue>(
    () => ({
      request,
      requestOpen: (module, id) => setRequest({ module, id }),
      consumeOpenRequest: () => setRequest(null),
    }),
    [request],
  )

  return <ModuleNavigationContext.Provider value={value}>{children}</ModuleNavigationContext.Provider>
}

export function useModuleNavigation() {
  const ctx = useContext(ModuleNavigationContext)
  if (!ctx) throw new Error('useModuleNavigation must be used within ModuleNavigationProvider')
  return ctx
}
