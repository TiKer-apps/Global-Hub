import { ModuleCard } from '@/components/module-card'
import type { PlanningWidgetConfig } from './types'

interface PlanningWidgetProps {
  config: PlanningWidgetConfig
}

export function PlanningWidget({ config }: PlanningWidgetProps) {
  return (
    <ModuleCard
      className="w-80"
      titleClassName="capitalize"
      headerClassName="bg-green-600 text-white"
      title={`Planning — ${config.view} (${config.mode})`}
    >
      <p className="text-sm text-muted-foreground">À implémenter.</p>
    </ModuleCard>
  )
}
