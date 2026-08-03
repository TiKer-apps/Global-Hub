import type { Meta, StoryObj } from '@storybook/react-vite'
import { buttonVariants } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from './popover'

const meta = {
  title: 'UI/Popover',
  component: Popover,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger className={buttonVariants({ variant: 'outline' })}>Ouvrir</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Titre</PopoverTitle>
          <PopoverDescription>Description courte.</PopoverDescription>
        </PopoverHeader>
        <p className="text-sm">Contenu libre du popover.</p>
      </PopoverContent>
    </Popover>
  ),
}
