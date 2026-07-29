import { useEffect, useState } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Bold, Italic, SpellCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import { ToolbarPopover } from '@/modules/text-editor/ToolbarPopover'
import { ToolbarDivider } from '@/modules/text-editor/ToolbarDivider'
import { TextStyleExtras } from '@/modules/text-editor/text-style'

const COLORS = ['#000000', '#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed']

const SIZES = [
  { label: 'S', value: '13px' },
  { label: 'M', value: '15px' },
  { label: 'L', value: '20px' },
]

interface NoteEditorProps {
  content: string
  onChange: (html: string) => void
  className?: string
}

// Éditeur volontairement minimal : gras, italique, taille et couleur de
// texte seulement — pas de titres, listes, citations, etc.
export function NoteEditor({ content, onChange, className }: NoteEditorProps) {
  // Désactivé par défaut : le soulignement rouge en pointillé du correcteur
  // orthographique du navigateur gêne la lecture pendant la saisie.
  const [spellCheck, setSpellCheck] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        code: false,
      }),
      TextStyleExtras,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'min-h-24 cursor-text rounded-md border p-2 text-sm focus:outline-none',
        spellcheck: 'false',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom as HTMLElement
    dom.setAttribute('spellcheck', String(spellCheck))
    // Chrome ne réévalue pas le texte déjà présent quand on bascule l'attribut
    // à chaud — seul un reflow forcé (ici via setEditable) déclenche une
    // nouvelle passe de vérification sur le contenu existant.
    editor.setEditable(false)
    void dom.offsetHeight
    editor.setEditable(true)
  }, [editor, spellCheck])

  // `editor.isActive(...)` lit l'état au moment de l'appel : sans ce hook,
  // rien ne force le composant à se re-rendre après un clic sur un bouton de
  // la toolbar (seule une frappe clavier déclenchait un re-render via
  // onUpdate), donc l'état actif restait visuellement figé jusque-là.
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return null
      return {
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        fontSize: SIZES.find((size) => editor.isActive('textStyle', { fontSize: size.value }))?.value ?? null,
        color: COLORS.find((color) => editor.isActive('textStyle', { color })) ?? null,
      }
    },
  })

  if (!editor || !editorState) return null

  const activeColor = editorState.color ?? '#000000'

  return (
    // `nodrag` : ce widget vit sur un canvas React Flow où tout est
    // draggable par défaut — sans ça, sélectionner du texte ou cliquer un
    // bouton déplace le widget au lieu d'agir sur l'éditeur.
    <div className={cn('nodrag space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-1 border-b pb-2">
        <ToolbarButton active={editorState.bold} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Gras">
          <Bold className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editorState.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italique"
        >
          <Italic className="size-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarPopover trigger={<span className="text-xs font-medium leading-none">Aa</span>} triggerLabel="Taille du texte">
          {SIZES.map((size) => (
            <ToolbarButton
              key={size.value}
              size="sm"
              active={editorState.fontSize === size.value}
              onClick={() => editor.chain().focus().setFontSize(size.value).run()}
            >
              {size.label}
            </ToolbarButton>
          ))}
        </ToolbarPopover>

        <ToolbarPopover
          triggerLabel="Couleur du texte"
          trigger={
            <>
              <span className="text-xs font-medium leading-none">A</span>
              <span
                className="absolute inset-x-1.5 bottom-1 h-0.5 rounded-full"
                style={{ backgroundColor: activeColor }}
              />
            </>
          }
          contentClassName="gap-1.5 p-2"
        >
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Couleur ${color}`}
              onClick={() => editor.chain().focus().setColor(color).run()}
              className={cn(
                'size-5 rounded-full border border-black/10',
                editorState.color === color && 'ring-2 ring-ring ring-offset-1',
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </ToolbarPopover>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => setSpellCheck((v) => !v)}
          aria-label={
            spellCheck
              ? 'Désactiver le correcteur orthographique'
              : 'Activer le correcteur orthographique'
          }
          aria-pressed={spellCheck}
          className="relative"
        >
          <SpellCheck className="size-3.5" />
          {!spellCheck && (
            <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="h-4 w-px rotate-45 bg-current" />
            </span>
          )}
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
