import { ChecklistWidget } from '@/modules/checklist/ChecklistWidget'
import type { ChecklistLine } from '@/modules/checklist/types'

interface TasksWidgetProps {
  lines?: ChecklistLine[]
  onToggleLine?: (lineId: string) => void
}

export function TasksWidget({ lines = [], onToggleLine }: TasksWidgetProps) {
  return (
    <ChecklistWidget
      title="Tâches"
      lines={lines}
      onToggleLine={onToggleLine}
      className="border-primary/30"
    />
  )
}
