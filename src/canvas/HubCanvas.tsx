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
import { PlanningWidget } from '@/modules/planning/PlanningWidget'
import { NotesWidget } from '@/modules/notes/NotesWidget'
import { PostItWidget } from '@/modules/post-its/PostItWidget'
import { PostItNote } from '@/modules/post-its/PostItNote'
import { TasksWidget } from '@/modules/tasks/TasksWidget'
import { TodoListWidget } from '@/modules/todo-list/TodoListWidget'
import { TodoSheetNote } from '@/modules/todo-list/TodoSheetNote'
import { ImportantWidget } from '@/modules/important/ImportantWidget'
import { ModuleNavigationProvider } from './module-navigation'

const nodeTypes: NodeTypes = {
  planning: () => <PlanningWidget config={{ view: 'week', mode: 'extended' }} />,
  notes: NotesWidget,
  postIt: PostItWidget,
  postItNote: ({ id }) => <PostItNote postItId={id} />,
  tasks: () => <TasksWidget />,
  todoList: () => <TodoListWidget />,
  todoSheetNote: ({ id }) => <TodoSheetNote sheetId={id} />,
  important: ImportantWidget,
}

const initialNodes: Node[] = [
  { id: 'planning-week', type: 'planning', position: { x: 0, y: 0 }, data: {} },
  { id: 'notes-1', type: 'notes', position: { x: 400, y: 0 }, data: {} },
  { id: 'post-it-1', type: 'postIt', position: { x: 720, y: 0 }, data: {} },
  { id: 'tasks-1', type: 'tasks', position: { x: 0, y: 300 }, data: {} },
  { id: 'todo-1', type: 'todoList', position: { x: 400, y: 300 }, data: {} },
  { id: 'important-1', type: 'important', position: { x: 720, y: 300 }, data: {} },
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
    <div className="h-screen w-screen">
      <ModuleNavigationProvider>
        <ReactFlow
          nodes={nodes}
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
  )
}
