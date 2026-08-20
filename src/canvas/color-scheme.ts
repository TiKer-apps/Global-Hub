import { useEffect, useLayoutEffect, useState } from 'react'

export type ColorScheme = 'light' | 'dark'

const STORAGE_KEY = 'global-hub:color-scheme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function loadExplicitScheme(): ColorScheme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === 'light' || raw === 'dark' ? raw : null
  } catch {
    return null
  }
}

function systemScheme(): ColorScheme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

// Pas de Context (même raisonnement que `module-visibility.ts`) : un seul
// point de montage à la fois (`ModuleDrawer`), et le `.dark` posé sur
// `<html>` fait déjà cascader l'effet visuel à toute l'app via les
// variables CSS déjà définies dans `index.css` (scaffold shadcn jamais
// activé jusqu'ici) — pas besoin de partager cet état React avec des
// descendants profonds.
//
// Tant qu'aucun choix explicite n'a été fait (première visite), suit
// `prefers-color-scheme` du système, y compris ses changements en direct
// — un choix explicite (bouton) prend le dessus et ignore ensuite les
// changements système, jusqu'à persistance dans `localStorage`.
export function useColorScheme() {
  const [explicit, setExplicit] = useState<ColorScheme | null>(loadExplicitScheme)
  const [system, setSystem] = useState<ColorScheme>(systemScheme)

  useEffect(() => {
    if (explicit) return
    const mql = window.matchMedia(DARK_QUERY)
    const handleChange = () => setSystem(systemScheme())
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [explicit])

  const scheme = explicit ?? system

  // `useLayoutEffect` (avant peinture, comme la mesure de `module-card.tsx`)
  // plutôt que `useEffect` : évite un flash visible clair→sombre au premier
  // rendu quand le système/la préférence enregistrée est "dark".
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', scheme === 'dark')
  }, [scheme])

  const setScheme = (next: ColorScheme) => {
    setExplicit(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage indisponible (mode privé strict...) : le choix reste
      // actif pour la session, juste pas persisté — pas bloquant.
    }
  }

  return { scheme, setScheme }
}
