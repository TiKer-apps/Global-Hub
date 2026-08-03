import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tabs, TabsList, TabsPanel, TabsTab } from './tabs'

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="notes" className="w-80">
      <TabsList>
        <TabsTab value="notes">Notes</TabsTab>
        <TabsTab value="tasks">Tâches</TabsTab>
        <TabsTab value="planning">Planning</TabsTab>
      </TabsList>
      <TabsPanel value="notes" className="pt-3 text-sm">
        Contenu de l'onglet Notes.
      </TabsPanel>
      <TabsPanel value="tasks" className="pt-3 text-sm">
        Contenu de l'onglet Tâches.
      </TabsPanel>
      <TabsPanel value="planning" className="pt-3 text-sm">
        Contenu de l'onglet Planning.
      </TabsPanel>
    </Tabs>
  ),
}

export const ManyTabs: Story = {
  render: () => (
    <Tabs defaultValue="important" className="w-[500px]">
      <TabsList>
        <TabsTab value="important">Important</TabsTab>
        <TabsTab value="planning">Planning</TabsTab>
        <TabsTab value="notes">Notes</TabsTab>
        <TabsTab value="tasks">Tâches</TabsTab>
        <TabsTab value="postit">Post-it</TabsTab>
        <TabsTab value="todolist">Todo-list</TabsTab>
      </TabsList>
      <TabsPanel value="important" className="pt-3 text-sm">
        Réglages du module Important.
      </TabsPanel>
      <TabsPanel value="planning" className="pt-3 text-sm">
        Réglages du module Planning.
      </TabsPanel>
      <TabsPanel value="notes" className="pt-3 text-sm">
        Réglages du module Notes.
      </TabsPanel>
      <TabsPanel value="tasks" className="pt-3 text-sm">
        Réglages du module Tâches.
      </TabsPanel>
      <TabsPanel value="postit" className="pt-3 text-sm">
        Réglages du module Post-it.
      </TabsPanel>
      <TabsPanel value="todolist" className="pt-3 text-sm">
        Réglages du module Todo-list.
      </TabsPanel>
    </Tabs>
  ),
}
