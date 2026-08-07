import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Copy, Eye, Pin, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RadialMenu, type RadialMenuItem } from './radial-menu'

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'middle'

const CORNER_CLASSNAME: Record<Corner, string> = {
  'top-left': 'top-6 left-6',
  'top-right': 'top-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-right': 'bottom-6 right-6',
  middle: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
}

// Arc orienté à l'opposé du bord le plus proche, comme le ferait
// ModuleRadialTrigger via sa détection de bord.
const ARC_RANGE_BY_CORNER: Record<Corner, [number, number]> = {
  'top-left': [0, 90],
  'top-right': [90, 180],
  'bottom-left': [270, 360],
  'bottom-right': [180, 270],
  middle: [180, 360],
}

const DEMO_ITEMS: Omit<RadialMenuItem, 'onSelect'>[] = [
  { id: 'new', label: 'Nouveau', icon: <Plus /> },
  { id: 'duplicate', label: 'Dupliquer', icon: <Copy /> },
  { id: 'pin', label: 'Épingler', icon: <Pin /> },
  { id: 'hide', label: 'Masquer', icon: <Eye /> },
  { id: 'delete', label: 'Supprimer', icon: <Trash2 /> },
]

// Simule un bouton de module positionné près (ou loin) d'un bord d'écran —
// le vrai anchor vient de `getBoundingClientRect()` sur ce bouton, exactement
// comme le fera `module-radial-trigger.tsx`.
function RadialMenuDemo({ mode, corner }: { mode: 'arc' | 'center'; corner: Corner }) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState({ x: 0, y: 0 })

  const items: RadialMenuItem[] = DEMO_ITEMS.map((item) => ({
    ...item,
    onSelect: () => console.log(`radial-menu: ${item.id}`),
  }))

  const openMenu = () => {
    const rect = btnRef.current!.getBoundingClientRect()
    setAnchor({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    setOpen(true)
  }

  return (
    <div className="relative h-[600px] w-full bg-muted/30">
      <button
        ref={btnRef}
        type="button"
        onClick={openMenu}
        aria-label="Ouvrir le menu radial"
        className={cn(
          'absolute flex size-9 items-center justify-center rounded-lg border bg-card shadow-md',
          CORNER_CLASSNAME[corner],
        )}
      >
        <Plus className="size-4" />
      </button>
      <RadialMenu
        items={items}
        anchor={anchor}
        mode={mode}
        arcRange={ARC_RANGE_BY_CORNER[corner]}
        centerTarget={{ x: 400, y: 300 }}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  )
}

const meta = {
  title: 'UI/RadialMenu',
  component: RadialMenu,
  parameters: { layout: 'fullscreen' },
  // Args factices : chaque story pilote son propre état via `render` (le
  // menu s'ouvre au clic sur le bouton simulé) — Storybook exige quand même
  // un `args` complet ici puisque tous les props de RadialMenu sont requis.
  args: {
    items: [],
    anchor: { x: 0, y: 0 },
    mode: 'arc',
    open: false,
    onClose: () => {},
  },
} satisfies Meta<typeof RadialMenu>

export default meta
type Story = StoryObj<typeof meta>

// Cas de base : bouton loin de tout bord, arc complet disponible.
export const ArcAwayFromEdge: Story = {
  render: () => <RadialMenuDemo mode="arc" corner="middle" />,
}

// Cas difficile : bouton en coin — comparer ArcNearCorner et CenterNearCorner
// (même position de bouton) pour juger quel scénario est le plus lisible ici.
export const ArcNearCorner: Story = {
  render: () => <RadialMenuDemo mode="arc" corner="bottom-right" />,
}

export const CenterNearCorner: Story = {
  render: () => <RadialMenuDemo mode="center" corner="bottom-right" />,
}
