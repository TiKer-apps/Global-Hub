import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { PostItNote } from '@/modules/post-its/PostItNote'
import { TodoSheetNote } from '@/modules/todo-list/TodoSheetNote'
import { ModuleDrawer } from './ModuleDrawer'
import { MODULES } from './module-registry'
import { ModuleNavigationProvider } from './module-navigation'
import { ModuleStyleProvider } from './module-style'
import { ModuleThemeProvider } from './module-theme'
import { useModuleVisibility } from './module-visibility'
import { WIDGET_COMPONENTS } from './widget-components'

// Layout mobile : liste empilée plutôt que le canvas React Flow zoomable
// de HubCanvas.tsx (pas adapté au tactile — pinch-zoom en conflit avec le
// scroll de page, glisser-souris pour sélectionner une plage horaire dans
// WeekGrid non plus). Utilisé sous le breakpoint de `useIsMobile` (voir
// App.tsx), à la place de HubCanvas, jamais en plus.
//
// `ReactFlowProvider` reste nécessaire malgré l'absence de `<ReactFlow>` :
// plusieurs widgets (PostItWidget, TodoListWidget, NotesWidget,
// PlanningWidget, ImportantWidget) appellent `useNodeId()`/`useReactFlow()`
// pour calculer une position de spawn ou un `fitView` de confort — sans
// provider ils lèveraient une erreur. Avec un provider nu, ces appels
// deviennent de simples no-op silencieux (aucune caméra à déplacer, x/y de
// spawn jamais lus ailleurs que par HubCanvas) : zéro changement requis
// dans ces widgets pour les faire fonctionner ici.
export function MobileHub() {
  const postIts = useLiveQuery(() => db.postIts.toArray(), []) ?? []
  const todoSheets = useLiveQuery(() => db.todoSheets.toArray(), []) ?? []
  const { hiddenModuleIds, toggleModule } = useModuleVisibility(postIts, todoSheets)

  return (
    <ModuleThemeProvider>
      <ModuleStyleProvider>
        <ReactFlowProvider>
          <ModuleNavigationProvider>
            <div className="min-h-screen w-screen">
              <ModuleDrawer
                hiddenModuleIds={hiddenModuleIds}
                onToggleModule={toggleModule}
                postIts={postIts}
                todoSheets={todoSheets}
              />
              <div className="flex flex-col items-center gap-4 p-4 pt-16">
                {MODULES.filter((module) => !hiddenModuleIds.has(module.id)).map((module) => {
                  const Widget = WIDGET_COMPONENTS[module.id]
                  return <Widget key={module.id} />
                })}
                {postIts
                  .filter((p) => !hiddenModuleIds.has(p.id))
                  .map((postIt) => (
                    <PostItNote key={postIt.id} postItId={postIt.id} />
                  ))}
                {todoSheets
                  .filter((s) => !hiddenModuleIds.has(s.id))
                  .map((sheet) => (
                    <TodoSheetNote key={sheet.id} sheetId={sheet.id} />
                  ))}
              </div>
            </div>
          </ModuleNavigationProvider>
        </ReactFlowProvider>
      </ModuleStyleProvider>
    </ModuleThemeProvider>
  )
}
