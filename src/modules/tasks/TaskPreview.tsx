import { Square } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface TaskPreviewProps {
  content: string
}

interface PreviewLine {
  text: string
  isItem: boolean
}

// Une ligne commençant par '-' devient un item à cocher (texte après le '-'),
// une ligne normale reste du texte simple — même convention que
// ChecklistLine/TodoSheet, mais dérivée à la volée ici (pas persistée : cet
// aperçu suit chaque frappe dans l'éditeur, cf. TasksWidget).
function parsePreviewLines(content: string): PreviewLine[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => {
      const isItem = line.startsWith('-')
      return { text: isItem ? line.slice(1).trim() : line, isItem }
    })
}

// Aperçu en direct de ce que donnera la tâche telle que tapée dans
// l'éditeur — les cases à cocher n'y sont pas interactives, cf. TasksWidget
// pour l'édition (le clic/cochage arrivera dans un prochain passage).
export function TaskPreview({ content }: TaskPreviewProps) {
  const { t } = useTranslation()
  const lines = parsePreviewLines(content)

  return (
    <div className="space-y-1 rounded-md border bg-muted/30 p-3 text-sm">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t('tasks.previewTitle')}</p>
      {lines.length === 0 ? (
        <p className="text-muted-foreground">{t('tasks.previewEmpty')}</p>
      ) : (
        lines.map((line, i) => (
          <div key={i} className="flex items-center gap-2">
            {line.isItem && <Square className="size-3.5 shrink-0 text-muted-foreground" />}
            <span className="truncate">{line.text}</span>
          </div>
        ))
      )}
    </div>
  )
}
