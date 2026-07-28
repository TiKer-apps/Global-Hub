import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ChecklistLine } from './types'

interface ChecklistWidgetProps {
  title: string
  lines: ChecklistLine[]
  onToggleLine?: (lineId: string) => void
  className?: string
}

// Composant partagé par les modules "tâches" et "todo-list" : même
// comportement (clic sur un item '-' -> barré ; clic sur une ligne non-item
// -> grisée + coche), styles différents portés par chaque module appelant.
export function ChecklistWidget({ title, lines, onToggleLine, className }: ChecklistWidgetProps) {
  return (
    <Card className={cn('w-72', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {lines.length === 0 && (
          <p className="text-sm text-muted-foreground">À implémenter.</p>
        )}
        {lines.map((line) => (
          <div
            key={line.id}
            onClick={() => onToggleLine?.(line.id)}
            className={cn(
              'cursor-pointer text-sm',
              line.isItem && line.done && 'line-through text-muted-foreground',
              !line.isItem && line.done && 'text-muted-foreground',
            )}
          >
            {!line.isItem && line.done ? `${line.text} ✓` : line.text}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
