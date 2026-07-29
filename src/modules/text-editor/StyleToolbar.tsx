import type { ReactNode } from 'react'
import type { Editor } from '@tiptap/core'
import { ALargeSmall, Bold, Italic, SpellCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ToolbarButton } from './ToolbarButton'
import { ToolbarPopover } from './ToolbarPopover'
import { ToolbarDivider } from './ToolbarDivider'
import { TEXT_COLORS, TEXT_SIZES, type RichTextEditorState } from './useRichTextEditor'
import { TEXT_FONTS } from './fonts'

interface StyleToolbarProps {
  editor: Editor
  editorState: RichTextEditorState
  spellCheck: boolean
  setSpellCheck: (update: boolean | ((prev: boolean) => boolean)) => void
  extra?: ReactNode
  className?: string
}

// Toolbar de mise en forme partagée par les notes et les post-its : gras,
// italique, taille, police et couleur de texte, correcteur orthographique.
// `extra` accueille des boutons propres à l'appelant (ex. suppression sur un
// post-it détaché) sans que ce composant ait besoin de les connaître.
export function StyleToolbar({ editor, editorState, spellCheck, setSpellCheck, extra, className }: StyleToolbarProps) {
  const activeColor = editorState.color ?? '#000000'
  const activeFont = TEXT_FONTS.find((f) => f.value === editorState.fontFamily) ?? TEXT_FONTS[0]

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
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

      <ToolbarPopover trigger={<ALargeSmall className="size-3.5" />} triggerLabel="Taille du texte">
        {TEXT_SIZES.map((size) => (
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
        triggerLabel="Police du texte"
        trigger={
          <span className="text-xs font-medium leading-none" style={{ fontFamily: activeFont.fontFamily }}>
            Aa
          </span>
        }
      >
        {TEXT_FONTS.map((f) => (
          <ToolbarButton
            key={f.value}
            size="sm"
            active={editorState.fontFamily === f.value}
            onClick={() => editor.chain().focus().setFontFamily(f.fontFamily).run()}
            aria-label={f.label}
            style={{ fontFamily: f.fontFamily }}
          >
            Aa
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
        {TEXT_COLORS.map((color) => (
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
        aria-label={spellCheck ? 'Désactiver le correcteur orthographique' : 'Activer le correcteur orthographique'}
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

      {extra}
    </div>
  )
}
