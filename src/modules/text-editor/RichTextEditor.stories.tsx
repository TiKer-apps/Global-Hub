import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { RichTextEditor } from './RichTextEditor'

// Démo locale : RichTextEditor ne resynchronise pas `content` après le
// montage (Tiptap ne l'utilise que comme valeur initiale), donc on capture
// juste les changements ici pour les afficher, sans re-contrôler l'éditeur.
function RichTextEditorDemo({ initialContent }: { initialContent: string }) {
  const [html, setHtml] = useState(initialContent)
  return (
    <div className="w-96 space-y-3">
      <RichTextEditor content={initialContent} onChange={setHtml} />
      <pre className="rounded bg-muted p-2 text-xs whitespace-pre-wrap">{html}</pre>
    </div>
  )
}

const meta = {
  title: 'Modules/TextEditor/RichTextEditor',
  component: RichTextEditorDemo,
} satisfies Meta<typeof RichTextEditorDemo>

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
