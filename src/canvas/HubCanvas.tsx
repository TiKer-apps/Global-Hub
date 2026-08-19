import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  type Node,
  type NodeChange,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { PostItNote } from '@/modules/post-its/PostItNote'
import { TodoSheetNote } from '@/modules/todo-list/TodoSheetNote'
import { ModuleDrawer } from './ModuleDrawer'
import { ModuleNavigationProvider } from './module-navigation'
import { ModuleStyleProvider } from './module-style'
import { ModuleThemeProvider } from './module-theme'
import { useModuleVisibility } from './module-visibility'
import { WIDGET_COMPONENTS } from './widget-components'

// `type` = id du module : chaque module fixe n'a qu'une seule instance, pas
// besoin d'une chaîne de "type" séparée de son id (cf. widget-components.tsx).
const nodeTypes: NodeTypes = {
  ...WIDGET_COMPONENTS,
  postItNote: ({ id }) => <PostItNote postItId={id} />,
  todoSheetNote: ({ id }) => <TodoSheetNote sheetId={id} />,
}

// Agencement qui reflète l'ordre de priorité voulu (cf. module-registry.ts) :
// Important puis Planning en premier (rangée 1, Planning bien plus large
// que les autres widgets — décalé pour ne pas chevaucher Important), Notes
// puis Tâches ensuite, enfin Post-it puis Todo-list (rangée 2).
const initialNodes: Node[] = [
  { id: 'important-1', type: 'important-1', position: { x: 0, y: 0 }, data: {} },
  { id: 'planning-week', type: 'planning-week', position: { x: 320, y: 0 }, data: {} },
  { id: 'notes-1', type: 'notes-1', position: { x: 0, y: 560 }, data: {} },
  { id: 'tasks-1', type: 'tasks-1', position: { x: 360, y: 560 }, data: {} },
  { id: 'post-it-1', type: 'post-it-1', position: { x: 720, y: 560 }, data: {} },
  { id: 'todo-1', type: 'todo-1', position: { x: 1000, y: 560 }, data: {} },
]

export function HubCanvas() {
  // Tous les nodes (fixes ET post-its détachés) vivent dans ce state unique
  // et passent par le flux standard `applyNodeChanges` — les faire suivre un
  // circuit séparé (position dérivée de Dexie en dehors de ce flux) perturbait
  // le suivi interne du drag par React Flow et faisait disparaître le node.
  // Dexie ne sert plus que de persistance : synchronisé DANS `nodes` quand un
  // post-it est ajouté/supprimé, et mis à jour DEPUIS `nodes` en fin de drag.
  const [nodes, setNodes] = useState(initialNodes)

  const postIts = useLiveQuery(() => db.postIts.toArray(), []) ?? []
  const postItIds = useMemo(() => new Set(postIts.map((p) => p.id)), [postIts])

  const todoSheets = useLiveQuery(() => db.todoSheets.toArray(), []) ?? []
  const todoSheetIds = useMemo(() => new Set(todoSheets.map((s) => s.id)), [todoSheets])

  // Nodes masqués via le drawer (cf. ModuleDrawer) — widgets fixes ou
  // post-its/fiches détachés individuels, même mécanisme pour les deux (le
  // filtre ci-dessous ne fait aucune distinction). Juste retirés du rendu,
  // pas de suppression : rouvrir un node masqué le refait apparaître à sa
  // position d'origine. Persisté + partagé avec le layout mobile, voir
  // module-visibility.ts.
  const { hiddenModuleIds, toggleModule } = useModuleVisibility(postIts, todoSheets)
  const visibleNodes = useMemo(() => nodes.filter((n) => !hiddenModuleIds.has(n.id)), [nodes, hiddenModuleIds])

  useEffect(() => {
    setNodes((nds) => {
      const existingIds = new Set(nds.map((n) => n.id))
      const stillPresent = nds.filter(
        (n) => (n.type !== 'postItNote' || postItIds.has(n.id)) && (n.type !== 'todoSheetNote' || todoSheetIds.has(n.id)),
      )
      // `zIndex: 1` : sans ça, un post-it/fiche détaché à l'instant apparaît
      // sous le widget fixe dont il vient de sortir — React Flow élève le
      // node encore "selected" (celui sur lequel on vient de cliquer un
      // bouton) via `elevateNodesOnSelect`, désactivé ci-dessous, mais
      // autant garantir l'ordre indépendamment de la sélection.
      const addedPostIts: Node[] = postIts
        .filter((p) => !existingIds.has(p.id))
        .map((p) => ({ id: p.id, type: 'postItNote', position: { x: p.x, y: p.y }, data: {}, zIndex: 1 }))
      const addedSheets: Node[] = todoSheets
        .filter((s) => !existingIds.has(s.id))
        .map((s) => ({ id: s.id, type: 'todoSheetNote', position: { x: s.x, y: s.y }, data: {}, zIndex: 1 }))
      const added = [...addedPostIts, ...addedSheets]
      return added.length ? [...stillPresent, ...added] : stillPresent
    })
  }, [postIts, postItIds, todoSheets, todoSheetIds])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds))

      for (const change of changes) {
        if (change.type !== 'position' || !change.position || change.dragging) continue
        if (postItIds.has(change.id)) {
          db.postIts.update(change.id, { x: change.position.x, y: change.position.y })
        } else if (todoSheetIds.has(change.id)) {
          db.todoSheets.update(change.id, { x: change.position.x, y: change.position.y })
        }
      }
    },
    [postItIds, todoSheetIds],
  )

  return (
    <ModuleThemeProvider>
      <ModuleStyleProvider>
        <div className="h-screen w-screen">
          <ModuleDrawer
            hiddenModuleIds={hiddenModuleIds}
            onToggleModule={toggleModule}
            postIts={postIts}
            todoSheets={todoSheets}
          />
          <ModuleNavigationProvider>
            <ReactFlow
              nodes={visibleNodes}
              onNodesChange={onNodesChange}
              nodeTypes={nodeTypes}
              nodesConnectable={false}
              elevateNodesOnSelect={false}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </ModuleNavigationProvider>
        </div>
      </ModuleStyleProvider>
    </ModuleThemeProvider>
  )
}
