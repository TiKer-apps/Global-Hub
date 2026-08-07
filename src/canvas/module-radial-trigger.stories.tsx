import type { Meta, StoryObj } from '@storybook/react-vite'
import { Background, Controls, ReactFlow, ReactFlowProvider, type Node, type NodeTypes } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Copy, Eye, Pin, Plus, Trash2 } from 'lucide-react'
import { ModuleCard } from '@/components/module-card'
import type { RadialMenuItem } from '@/components/ui/radial-menu'
import { ModuleRadialTrigger } from './module-radial-trigger'

const DEMO_ITEMS: Omit<RadialMenuItem, 'onSelect'>[] = [
  { id: 'new', label: 'Nouveau', icon: <Plus /> },
  { id: 'duplicate', label: 'Dupliquer', icon: <Copy /> },
  { id: 'pin', label: 'Épingler', icon: <Pin /> },
  { id: 'hide', label: 'Masquer', icon: <Eye /> },
  { id: 'delete', label: 'Supprimer', icon: <Trash2 /> },
]

function DemoModule() {
  const items: RadialMenuItem[] = DEMO_ITEMS.map((item) => ({
    ...item,
    onSelect: () => console.log(`radial-menu: ${item.id}`),
  }))

  return (
    <ModuleRadialTrigger items={items}>
      <ModuleCard title="Planning" headerClassName="bg-green-600 text-white" className="w-72">
        <p className="text-sm text-muted-foreground">
          Glisse-dépose ce node vers un bord de l'écran, puis clique le bouton "⋮" — le module doit glisser
          jusqu'au centre exact avant que le menu radial complet s'ouvre. Zoom/pan pendant que le menu est
          ouvert doit le refermer immédiatement.
        </p>
      </ModuleCard>
    </ModuleRadialTrigger>
  )
}

const nodeTypes: NodeTypes = { demo: DemoModule }
const initialNodes: Node[] = [{ id: 'demo-1', type: 'demo', position: { x: 400, y: 250 }, data: {} }]

// Enveloppé dans un vrai <ReactFlow> (pas un mock) : useReactFlow()/getZoom()
// et useOnViewportChange() doivent être exercés pour de vrai, sinon cette
// story ne validerait rien de la mécanique de glissement elle-même.
function RadialTriggerCanvas() {
  return (
    <div className="h-[600px] w-full">
      <ReactFlowProvider>
        <ReactFlow nodes={initialNodes} nodeTypes={nodeTypes} nodesConnectable={false} elevateNodesOnSelect={false}>
          <Background />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}

const meta = {
  title: 'Canvas/ModuleRadialTrigger',
  component: RadialTriggerCanvas,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof RadialTriggerCanvas>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
