import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { NoteEditor } from './NoteEditor'

// Démo locale : NoteEditor ne resynchronise pas `content` après le montage
// (Tiptap ne l'utilise que comme valeur initiale), donc on capture juste les
// changements ici pour les afficher, sans re-contrôler l'éditeur.
function NoteEditorDemo({ initialContent }: { initialContent: string }) {
  const [html, setHtml] = useState(initialContent)
  return (
    <div className="w-96 space-y-3">
      <NoteEditor content={initialContent} onChange={setHtml} />
      <pre className="rounded bg-muted p-2 text-xs whitespace-pre-wrap">{html}</pre>
    </div>
  )
}

const meta = {
  title: 'Modules/Notes/NoteEditor',
  component: NoteEditorDemo,
} satisfies Meta<typeof NoteEditorDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: { initialContent: '' },
}

export const WithContent: Story = {
  args: {
    initialContent: '<p>Une <strong>première</strong> note, avec un peu de <em>style</em>.</p>',
  },
}
