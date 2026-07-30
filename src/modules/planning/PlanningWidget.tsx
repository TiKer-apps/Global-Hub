import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Briefcase, CalendarDays, CalendarRange, Clock, LayoutGrid, Rows3 } from 'lucide-react'
import { ModuleCard } from '@/components/module-card'
import { db } from '@/lib/db'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import { WeekGrid } from './WeekGrid'
import { WeekMinimal } from './WeekMinimal'
import type { PlanningMode, PlanningWidgetConfig } from './types'

interface PlanningWidgetProps {
  config: PlanningWidgetConfig
}

type ViewMode = 'grid' | 'minimal'

// `daysCount`/`hourMode`/`viewMode` sont des options d'affichage propres à ce
// widget (choisies dans l'UI, pas figées par la config du node) — `config`
// ne sert plus que de valeur initiale.
export function PlanningWidget({ config }: PlanningWidgetProps) {
  const events = useLiveQuery(() => db.events.toArray(), []) ?? []
  const [daysCount, setDaysCount] = useState<5 | 7>(7)
  const [hourMode, setHourMode] = useState<PlanningMode>(config.mode)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  return (
    <ModuleCard
      className="w-[640px]"
      titleClassName="capitalize"
      headerClassName="bg-green-600 text-white"
      title={`Planning — ${config.view}`}
      action={
        config.view === 'week' ? (
          <>
            <ToolbarButton
              onClick={() => setDaysCount((d) => (d === 7 ? 5 : 7))}
              aria-label={daysCount === 7 ? 'Passer à 5 jours' : 'Passer à 7 jours'}
            >
              {daysCount === 7 ? <CalendarDays className="size-3.5" /> : <CalendarRange className="size-3.5" />}
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setHourMode((m) => (m === 'extended' ? 'compact' : 'extended'))}
              disabled={viewMode === 'minimal'}
              aria-label={hourMode === 'extended' ? 'Passer en horaires compacts (8h-19h)' : 'Passer en horaires étendus (00h-24h)'}
            >
              {hourMode === 'extended' ? <Clock className="size-3.5" /> : <Briefcase className="size-3.5" />}
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setViewMode((v) => (v === 'grid' ? 'minimal' : 'grid'))}
              aria-label={viewMode === 'grid' ? 'Passer en mode minimaliste' : 'Passer en mode grille'}
            >
              {viewMode === 'grid' ? <Rows3 className="size-3.5" /> : <LayoutGrid className="size-3.5" />}
            </ToolbarButton>
          </>
        ) : undefined
      }
    >
      {config.view === 'week' ? (
        viewMode === 'grid' ? (
          <WeekGrid events={events} mode={hourMode} daysCount={daysCount} />
        ) : (
          <WeekMinimal events={events} daysCount={daysCount} />
        )
      ) : (
        <p className="text-sm text-muted-foreground">Vue « {config.view} » à implémenter.</p>
      )}
    </ModuleCard>
  )
}
