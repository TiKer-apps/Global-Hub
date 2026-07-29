import { useEffect, useState } from 'react'
import { useEditor, useEditorState } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextStyleExtras } from './text-style'
import { TEXT_FONTS } from './fonts'

export const TEXT_COLORS = ['#000000', '#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed']

export const TEXT_SIZES = [
  { label: 'S', value: '13px' },
  { label: 'M', value: '15px' },
  { label: 'L', value: '20px' },
]

export interface RichTextEditorState {
  bold: boolean
  italic: boolean
  fontSize: string | null
  color: string | null
  fontFamily: string
}

// Logique d'édition partagée par les notes et les post-its : mêmes
// extensions Tiptap, même correcteur orthographique désactivable, même état
// dérivé pour piloter la toolbar. `editable` contrôlé par l'appelant (les
// post-its basculent entre affichage figé et édition active).
export function useRichTextEditor(
  content: string,
  onChange: (html: string) => void,
  editable = true,
  placeholder?: string,
) {
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
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'cursor-text text-sm focus:outline-none',
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
    editor.setEditable(editable)
  }, [editor, spellCheck, editable])

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
        fontSize: TEXT_SIZES.find((size) => editor.isActive('textStyle', { fontSize: size.value }))?.value ?? null,
        color: TEXT_COLORS.find((color) => editor.isActive('textStyle', { color })) ?? null,
        fontFamily:
          TEXT_FONTS.find((f) => editor.isActive('textStyle', { fontFamily: f.fontFamily }))?.value ?? 'sans',
      }
    },
  })

  return { editor, editorState, spellCheck, setSpellCheck }
}
