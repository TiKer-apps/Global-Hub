import { useCallback, useEffect, useState } from 'react'
import { MODULES } from './module-registry'

const STORAGE_KEY = 'global-hub:hidden-modules'

function loadHiddenIds(defaultHiddenIds: Set<string>): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : defaultHiddenIds
  } catch {
    return defaultHiddenIds
  }
}

interface PostItLike {
  id: string
}
interface TodoSheetLike {
  id: string
}

// Extrait de HubCanvas.tsx pour être partagé avec le layout mobile
// (MobileHub.tsx) — un seul consommateur à la fois (HubCanvas OU
// MobileHub, jamais les deux simultanément), donc un simple hook persistant
// via localStorage suffit, pas besoin d'un Context (contrairement à
// module-theme.tsx/module-style.tsx, consommés par des descendants profonds
// pendant que le Provider reste monté au-dessus).
//
// Masquer/afficher Post-it ou Todo-list masque/affiche aussi ses instances
// détachées — mais cliquer une instance individuelle ne touche jamais au
// module ni à ses autres instances (asymétrique, cf. demande utilisateur).
//
// `defaultHiddenIds` : uniquement utilisé tant qu'aucune préférence n'est
// encore enregistrée (première visite) — MobileHub s'en sert pour ne
// montrer que Planning par défaut sur petit écran (voir son commentaire),
// HubCanvas ne le passe pas (comportement desktop inchangé, tout visible).
export function useModuleVisibility(
  postIts: PostItLike[],
  todoSheets: TodoSheetLike[],
  defaultHiddenIds: Set<string> = new Set(),
) {
  const [hiddenModuleIds, setHiddenModuleIds] = useState<Set<string>>(() => loadHiddenIds(defaultHiddenIds))

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...hiddenModuleIds]))
  }, [hiddenModuleIds])

  const toggleModule = useCallback(
    (id: string) => {
      setHiddenModuleIds((prev) => {
        const next = new Set(prev)
        const willHide = !next.has(id)

        const module = MODULES.find((m) => m.id === id)
        const childIds =
          module?.instanceKind === 'postIt'
            ? postIts.map((p) => p.id)
            : module?.instanceKind === 'todoSheet'
              ? todoSheets.map((s) => s.id)
              : []

        for (const targetId of [id, ...childIds]) {
          if (willHide) next.add(targetId)
          else next.delete(targetId)
        }
        return next
      })
    },
    [postIts, todoSheets],
  )

  return { hiddenModuleIds, toggleModule }
}
