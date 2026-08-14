import { Editor } from '@tiptap/core'
import { StarterKit } from '@tiptap/starter-kit'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TextStyleExtras } from './text-style'

// `.test.tsx` (pas `.test.ts`) volontairement : cette extension Tiptap a
// besoin d'un vrai DOM (ProseMirror manipule `document`), donc du projet
// `component` (navigateur) — le projet `unit` tourne en Node sans DOM.
describe('TextStyleExtras', () => {
  let editor: Editor

  beforeEach(() => {
    editor = new Editor({
      extensions: [StarterKit, TextStyleExtras],
      content: '<p>Bonjour</p>',
    })
  })

  afterEach(() => {
    editor.destroy()
  })

  function selectAll() {
    editor.commands.selectAll()
  }

  it('setColor wraps the selection in a textStyle mark with the given color', () => {
    selectAll()
    editor.commands.setColor('#dc2626')
    // Le navigateur normalise la couleur en rgb() en relisant `style.color`
    // (renderHTML écrit du hex, mais le DOM sérialise dans son propre
    // format) — d'où la comparaison en rgb plutôt qu'en hex.
    expect(editor.getHTML()).toContain('color: rgb(220, 38, 38)')
  })

  it('unsetColor removes the color and drops the now-empty textStyle mark', () => {
    selectAll()
    editor.commands.setColor('#dc2626')
    editor.commands.unsetColor()
    expect(editor.getHTML()).not.toContain('style=')
  })

  it('setFontSize applies a font-size style', () => {
    selectAll()
    editor.commands.setFontSize('20px')
    expect(editor.getHTML()).toContain('font-size: 20px')
  })

  it('setFontFamily applies a font-family style', () => {
    selectAll()
    editor.commands.setFontFamily('Courier New')
    expect(editor.getHTML()).toContain('font-family')
    expect(editor.getHTML()).toContain('Courier New')
  })

  it('color, fontSize and fontFamily coexist on the same textStyle mark', () => {
    selectAll()
    editor.commands.setColor('#16a34a')
    editor.commands.setFontSize('13px')
    editor.commands.setFontFamily('inherit')

    const html = editor.getHTML()
    expect(html).toContain('color: rgb(22, 163, 74)')
    expect(html).toContain('font-size: 13px')
    expect(html).toContain('font-family: inherit')
  })

  it('round-trips a color style through parseHTML when loading existing content', () => {
    const loaded = new Editor({
      extensions: [StarterKit, TextStyleExtras],
      content: '<p><span style="color: #2563eb">Bleu</span></p>',
    })

    expect(loaded.getAttributes('textStyle').color).toBe('rgb(37, 99, 235)')
    loaded.destroy()
  })
})
