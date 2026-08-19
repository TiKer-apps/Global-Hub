import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { HeaderStyle } from '@/components/module-card'

const STORAGE_KEY = 'global-hub:module-styles'

// `labelKey` (`moduleSettings.styles.<id>`), pas le libellé affiché
// directement — résolue via `t()` au point de rendu (`ModuleSettingsModal`),
// même pattern que `ThemePreset.labelKey`.
export const HEADER_STYLE_OPTIONS: { id: HeaderStyle; labelKey: string }[] = [
  { id: 'wave', labelKey: 'moduleSettings.styles.wave' },
  { id: 'flat', labelKey: 'moduleSettings.styles.flat' },
]

type StyleMap = Record<string, HeaderStyle>

function loadStyleMap(): StyleMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StyleMap) : {}
  } catch {
    return {}
  }
}

interface ModuleStyleContextValue {
  styleMap: StyleMap
  setStyleId: (moduleId: string, styleId: HeaderStyle) => void
}

const ModuleStyleContext = createContext<ModuleStyleContextValue | null>(null)

// Style du header (cf. HeaderStyle dans module-card.tsx) choisi par module,
// persisté dans localStorage — même mécanisme que le thème de couleur (cf.
// module-theme.tsx), mais une préoccupation distincte donc un store séparé.
export function ModuleStyleProvider({ children }: { children: ReactNode }) {
  const [styleMap, setStyleMap] = useState<StyleMap>(loadStyleMap)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(styleMap))
  }, [styleMap])

  const value = useMemo<ModuleStyleContextValue>(
    () => ({
      styleMap,
      setStyleId: (moduleId, styleId) => setStyleMap((prev) => ({ ...prev, [moduleId]: styleId })),
    }),
    [styleMap],
  )

  return <ModuleStyleContext.Provider value={value}>{children}</ModuleStyleContext.Provider>
}

function useModuleStyleContext() {
  const ctx = useContext(ModuleStyleContext)
  if (!ctx) throw new Error('useModuleStyleContext must be used within ModuleStyleProvider')
  return ctx
}

export function useModuleStyleId(moduleId: string, defaultStyleId: HeaderStyle): HeaderStyle {
  const { styleMap } = useModuleStyleContext()
  return styleMap[moduleId] ?? defaultStyleId
}

export function useSetModuleStyle() {
  return useModuleStyleContext().setStyleId
}
