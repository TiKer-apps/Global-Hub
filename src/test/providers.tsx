import type { ReactNode } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { ModuleNavigationProvider } from '@/canvas/module-navigation'
import { ModuleStyleProvider } from '@/canvas/module-style'
import { ModuleThemeProvider } from '@/canvas/module-theme'

// Wrapper commun aux tests de widgets : la plupart utilisent `useReactFlow`/
// `useNodeId` (positionnement sur le canvas), `useModuleNavigation`
// (coordination Important -> widget) et/ou `useModuleHeaderClassName`/
// `useModuleStyleId` (thème et style de header, cf. ModuleCard) — chacun
// plante hors de son Provider respectif.
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ReactFlowProvider>
      <ModuleThemeProvider>
        <ModuleStyleProvider>
          <ModuleNavigationProvider>{children}</ModuleNavigationProvider>
        </ModuleStyleProvider>
      </ModuleThemeProvider>
    </ReactFlowProvider>
  )
}
