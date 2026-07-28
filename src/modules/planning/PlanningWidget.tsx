import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PlanningWidgetConfig } from './types'

interface PlanningWidgetProps {
  config: PlanningWidgetConfig
}

export function PlanningWidget({ config }: PlanningWidgetProps) {
  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="capitalize">
          Planning — {config.view} ({config.mode})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">À implémenter.</p>
      </CardContent>
    </Card>
  )
}
