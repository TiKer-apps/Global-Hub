import { TextStyle } from '@tiptap/extension-text-style'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textStyleExtras: {
      setColor: (color: string) => ReturnType
      unsetColor: () => ReturnType
      setFontSize: (fontSize: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

// Tiptap ne fournit pas d'extension FontSize stable (uniquement en
// prerelease), et le mark `textStyle` ne peut porter qu'un seul jeu
// d'attributs enregistré sous ce nom : color et fontSize sont donc
// regroupés dans une seule extension plutôt qu'empilés séparément (deux
// extensions nommées `textStyle` s'écraseraient l'une l'autre).
export const TextStyleExtras = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      color: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.color || null,
        renderHTML: (attributes: { color?: string | null }) => {
          if (!attributes.color) return {}
          return { style: `color: ${attributes.color}` }
        },
      },
      fontSize: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontSize || null,
        renderHTML: (attributes: { fontSize?: string | null }) => {
          if (!attributes.fontSize) return {}
          return { style: `font-size: ${attributes.fontSize}` }
        },
      },
    }
  },
  addCommands() {
    return {
      ...this.parent?.(),
      setColor:
        (color: string) =>
        ({ chain }) =>
          chain().setMark('textStyle', { color }).run(),
      unsetColor:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { color: null }).removeEmptyTextStyle().run(),
      setFontSize:
        (fontSize: string) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})
