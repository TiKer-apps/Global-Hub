import { useCallback, useState } from 'react'
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
import { PlanningWidget } from '@/modules/planning/PlanningWidget'
import { NotesWidget } from '@/modules/notes/NotesWidget'
import { PostItWidget } from '@/modules/post-its/PostItWidget'
import { TasksWidget } from '@/modules/tasks/TasksWidget'
import { TodoListWidget } from '@/modules/todo-list/TodoListWidget'
import { ImportantWidget } from '@/modules/important/ImportantWidget'

const nodeTypes: NodeTypes = {
  planning: () => <PlanningWidget config={{ view: 'week', mode: 'extended' }} />,
  notes: NotesWidget,
  postIt: PostItWidget,
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
  const [nodes, setNodes] = useState(initialNodes)

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  )

  return (
    <div className="h-screen w-screen">
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
    </div>
  )
}
