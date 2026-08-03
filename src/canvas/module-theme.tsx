import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getPreset } from './theme-presets'

const STORAGE_KEY = 'global-hub:module-themes'

type ThemeMap = Record<string, string>

function loadThemeMap(): ThemeMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ThemeMap) : {}
  } catch {
    return {}
  }
}

interface ModuleThemeContextValue {
  themeMap: ThemeMap
  setThemeId: (moduleId: string, themeId: string) => void
}

const ModuleThemeContext = createContext<ModuleThemeContextValue | null>(null)

// Thème (couleurs de header) choisi par module, persisté dans localStorage —
// contrairement à la visibilité (drawer), c'est une préférence d'apparence
// durable, pas un état d'affichage ponctuel.
export function ModuleThemeProvider({ children }: { children: ReactNode }) {
  const [themeMap, setThemeMap] = useState<ThemeMap>(loadThemeMap)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themeMap))
  }, [themeMap])

  const value = useMemo<ModuleThemeContextValue>(
    () => ({
      themeMap,
      setThemeId: (moduleId, themeId) => setThemeMap((prev) => ({ ...prev, [moduleId]: themeId })),
    }),
    [themeMap],
  )

  return <ModuleThemeContext.Provider value={value}>{children}</ModuleThemeContext.Provider>
}

function useModuleThemeContext() {
  const ctx = useContext(ModuleThemeContext)
  if (!ctx) throw new Error('useModuleThemeContext must be used within ModuleThemeProvider')
  return ctx
}

// Id du thème actuel d'un module (personnalisé ou par défaut) — utilisé par
// la modale de réglages pour présélectionner le bon preset.
export function useModuleThemeId(moduleId: string, defaultThemeId: string): string {
  const { themeMap } = useModuleThemeContext()
  return themeMap[moduleId] ?? defaultThemeId
}

// `headerClassName` résolu pour un widget donné — thème personnalisé s'il
// existe, sinon celui défini par défaut pour ce module (cf.
// module-registry.ts). Chaque widget appelle ceci avec son propre id/défaut
// à la place d'un `headerClassName` en dur.
export function useModuleHeaderClassName(moduleId: string, defaultThemeId: string): string {
  const themeId = useModuleThemeId(moduleId, defaultThemeId)
  return getPreset(themeId)?.headerClassName ?? getPreset(defaultThemeId)!.headerClassName
}

export function useSetModuleTheme() {
  return useModuleThemeContext().setThemeId
}
