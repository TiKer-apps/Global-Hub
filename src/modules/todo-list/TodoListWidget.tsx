import { ChecklistWidget } from '@/modules/checklist/ChecklistWidget'
import type { ChecklistLine } from '@/modules/checklist/types'

interface TodoListWidgetProps {
  lines?: ChecklistLine[]
  onToggleLine?: (lineId: string) => void
}

export function TodoListWidget({ lines = [], onToggleLine }: TodoListWidgetProps) {
  return (
    <ChecklistWidget
      title="Todo-list"
      lines={lines}
      onToggleLine={onToggleLine}
      className="border-dashed"
    />
  )
}
