import { EditorContent } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { useRichTextEditor } from './useRichTextEditor'
import { StyleToolbar } from './StyleToolbar'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  className?: string
  placeholder?: string
}

// Éditeur volontairement minimal : gras, italique, taille, police et couleur
// de texte — pas de titres, listes, citations, etc. Partagé par les notes et
// les post-its (composition toolbar inline + contenu ; pour un post-it
// détaché, dont la toolbar doit flotter au-dessus, voir useRichTextEditor +
// StyleToolbar utilisés séparément dans PostItNote).
export function RichTextEditor({ content, onChange, className, placeholder }: RichTextEditorProps) {
  const { editor, editorState, spellCheck, setSpellCheck } = useRichTextEditor(content, onChange, true, placeholder)

  if (!editor || !editorState) return null

  return (
    // `nodrag` : ce widget vit sur un canvas React Flow où tout est
    // draggable par défaut — sans ça, sélectionner du texte ou cliquer un
    // bouton déplace le widget au lieu d'agir sur l'éditeur.
    <div className={cn('nodrag space-y-2', className)}>
      <StyleToolbar
        editor={editor}
        editorState={editorState}
        spellCheck={spellCheck}
        setSpellCheck={setSpellCheck}
        className="border-b pb-2"
      />
      <EditorContent editor={editor} className="min-h-24 rounded-md border p-2" />
    </div>
  )
}
