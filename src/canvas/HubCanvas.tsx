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
import { ImportantWidget } from '@/modules/important/ImportantWidget'
import { NotesNavigationProvider } from './notes-navigation'

const nodeTypes: NodeTypes = {
  planning: () => <PlanningWidget config={{ view: 'week', mode: 'extended' }} />,
  notes: NotesWidget,
  postIt: PostItWidget,
  postItNote: ({ id }) => <PostItNote postItId={id} />,
  tasks: () => <TasksWidget />,
  todoList: () => <TodoListWidget />,
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

  useEffect(() => {
    setNodes((nds) => {
      const existingIds = new Set(nds.map((n) => n.id))
      const stillPresent = nds.filter((n) => n.type !== 'postItNote' || postItIds.has(n.id))
      const added: Node[] = postIts
        .filter((p) => !existingIds.has(p.id))
        .map((p) => ({ id: p.id, type: 'postItNote', position: { x: p.x, y: p.y }, data: {} }))
      return added.length ? [...stillPresent, ...added] : stillPresent
    })
  }, [postIts, postItIds])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds))

      for (const change of changes) {
        if (change.type === 'position' && change.position && !change.dragging && postItIds.has(change.id)) {
          db.postIts.update(change.id, { x: change.position.x, y: change.position.y })
        }
      }
    },
    [postItIds],
  )

  return (
    <div className="h-screen w-screen">
      <NotesNavigationProvider>
        <ReactFlow
          nodes={nodes}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          nodesConnectable={false}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </NotesNavigationProvider>
    </div>
  )
}
