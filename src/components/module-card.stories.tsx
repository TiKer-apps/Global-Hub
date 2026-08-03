import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import { ModuleCard } from './module-card'

const meta = {
  title: 'Components/ModuleCard',
  component: ModuleCard,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ModuleCard>

export default meta
type Story = StoryObj<typeof meta>

export const Notes: Story = {
  args: {
    title: 'Notes',
    headerClassName: 'bg-blue-300 text-white',
    className: 'w-80',
    action: (
      <ToolbarButton aria-label="Nouvelle note">
        <Plus className="size-3.5" />
      </ToolbarButton>
    ),
    children: <p className="text-sm text-muted-foreground">Contenu du module.</p>,
  },
}

export const PostIt: Story = {
  args: {
    title: 'Post-it',
    headerClassName: 'bg-yellow-400 text-black',
    className: 'w-64',
    children: <div className="size-32 bg-yellow-200 p-2 text-sm">Contenu…</div>,
  },
}

export const Important: Story = {
  args: {
    title: 'Important',
    headerClassName: 'bg-orange-300 text-white',
    className: 'w-72',
    children: <p className="text-sm text-muted-foreground">Rien de marqué important pour l'instant.</p>,
  },
}

export const TodoList: Story = {
  args: {
    title: 'Todo-list',
    headerClassName: 'bg-red-500 text-white',
    className: 'w-72',
    children: <p className="text-sm text-muted-foreground">Feuille de la todo-list.</p>,
  },
}

export const Tasks: Story = {
  args: {
    title: 'Tâches',
    headerClassName: 'bg-violet-500 text-white',
    className: 'w-80',
    children: <p className="text-sm text-muted-foreground">Liste de tâches.</p>,
  },
}

export const Planning: Story = {
  args: {
    title: 'Planning — Week',
    headerClassName: 'bg-green-600 text-white',
    className: 'w-[500px]',
    children: <p className="text-sm text-muted-foreground">Grille de planning.</p>,
  },
}

export const WithMultipleActions: Story = {
  args: {
    title: 'Notes',
    headerClassName: 'bg-blue-300 text-white',
    className: 'w-80',
    action: (
      <>
        <ToolbarButton aria-label="Retour à la liste">
          <ArrowLeft className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton aria-label="Supprimer">
          <Trash2 className="size-3.5" />
        </ToolbarButton>
      </>
    ),
    children: <p className="text-sm text-muted-foreground">Vue éditeur.</p>,
  },
}

// Le titre du header est une forme SVG mesurée dynamiquement (largeur du
// texte) — ce cas vérifie que la découpe reste correcte avec un titre long.
export const LongTitle: Story = {
  args: {
    title: 'Planning — Week (Extended)',
    titleClassName: 'capitalize',
    headerClassName: 'bg-green-600 text-white',
    className: 'w-[500px]',
    children: <p className="text-sm text-muted-foreground">Titre long dans le header.</p>,
  },
}

export const NoAction: Story = {
  args: {
    title: 'Tâches',
    headerClassName: 'bg-violet-500 text-white',
    className: 'w-80',
    children: <p className="text-sm text-muted-foreground">Sans action dans le header.</p>,
  },
}

// Style "plein" (cf. HeaderStyle dans module-card.tsx) — une seule couleur
// pleine sur toute la largeur, sans l'encoche SVG entre titre et actions.
export const Flat: Story = {
  args: {
    title: 'Notes',
    headerClassName: 'bg-blue-300 text-white',
    className: 'w-80',
    variant: 'flat',
    action: (
      <ToolbarButton aria-label="Nouvelle note">
        <Plus className="size-3.5" />
      </ToolbarButton>
    ),
    children: <p className="text-sm text-muted-foreground">Contenu du module.</p>,
  },
}

export const FlatLongTitle: Story = {
  args: {
    title: 'Planning — Week (Extended)',
    titleClassName: 'capitalize',
    headerClassName: 'bg-green-600 text-white',
    className: 'w-[500px]',
    variant: 'flat',
    children: <p className="text-sm text-muted-foreground">Titre long dans le header à plat.</p>,
  },
}
