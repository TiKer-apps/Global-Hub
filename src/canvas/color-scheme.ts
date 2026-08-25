import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react'

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

// Petit store externe (pas de Context) : `useColorScheme` est maintenant
// consommé depuis plusieurs points de montage à la fois (`ModuleDrawer`
// pour le switch, `HubCanvas` pour le `colorMode` de React Flow) — un
// `useState` local par composant, comme au départ, désynchroniserait ces
// instances (le choix fait dans l'une ne serait pas vu par l'autre avant
// un remount). `useSyncExternalStore` partage la même valeur `explicit`
// entre toutes les instances, tout en gardant le `.dark` posé sur `<html>`
// comme seul mécanisme de propagation visuelle vers le reste de l'app (pas
// besoin de Context pour ça).
let explicitScheme = loadExplicitScheme()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getExplicitSnapshot() {
  return explicitScheme
}

// Tant qu'aucun choix explicite n'a été fait (première visite), suit
// `prefers-color-scheme` du système, y compris ses changements en direct
// — un choix explicite (bouton) prend le dessus et ignore ensuite les
// changements système, jusqu'à persistance dans `localStorage`.
export function useColorScheme() {
  const explicit = useSyncExternalStore(subscribe, getExplicitSnapshot)
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

  return { scheme, setScheme }
}

function setScheme(next: ColorScheme) {
  explicitScheme = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // localStorage indisponible (mode privé strict...) : le choix reste
    // actif pour la session, juste pas persisté — pas bloquant.
  }
  listeners.forEach((listener) => listener())
}
