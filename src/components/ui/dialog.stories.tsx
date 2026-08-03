import type { Meta, StoryObj } from '@storybook/react-vite'
import { buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger className={buttonVariants({ variant: 'default' })}>Ouvrir la modale</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Titre de la modale</DialogTitle>
          <DialogDescription>Une description courte du contenu.</DialogDescription>
        </DialogHeader>
        <p className="text-sm">Corps de la modale — n'importe quel contenu ici.</p>
        <DialogFooter>
          <DialogClose className={buttonVariants({ variant: 'ghost' })}>Annuler</DialogClose>
          <button className={buttonVariants({ variant: 'default' })}>Confirmer</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const WithForm: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger className={buttonVariants({ variant: 'outline' })}>Nouvel événement</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel événement</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Titre"
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <DialogFooter>
            <DialogClose className={buttonVariants({ variant: 'ghost' })}>Annuler</DialogClose>
            <button type="submit" className={buttonVariants({ variant: 'default' })}>
              Créer
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  ),
}
