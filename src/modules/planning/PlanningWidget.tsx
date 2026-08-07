import { useCallback, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Briefcase, CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Clock, LayoutGrid, Plus, Rows3, Upload } from 'lucide-react'
import { ModuleCard } from '@/components/module-card'
import type { RadialMenuItem } from '@/components/ui/radial-menu'
import { useModuleHeaderClassName } from '@/canvas/module-theme'
import { useModuleStyleId } from '@/canvas/module-style'
import { ModuleRadialTrigger } from '@/canvas/module-radial-trigger'
import { db } from '@/lib/db'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import { addDays, formatWeekRange, getWeekDays } from './date-utils'
import { EventFormModal } from './EventFormModal'
import { importIcsEvents } from './ics-import'
import { WeekGrid } from './WeekGrid'
import { WeekMinimal } from './WeekMinimal'
import type { PlanningMode, PlanningWidgetConfig, TimeRangeSelection } from './types'

const SELECTION_DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

function formatSelection(selection: TimeRangeSelection): string {
  return `${String(selection.startHour).padStart(2, '0')}h–${String(selection.endHour).padStart(2, '0')}h, ${SELECTION_DATE_FORMAT.format(selection.day)}`
}

interface PlanningWidgetProps {
  config: PlanningWidgetConfig
}

type ViewMode = 'grid' | 'minimal'

// `daysCount`/`hourMode`/`viewMode`/`referenceDate` sont des options
// d'affichage propres à ce widget (choisies dans l'UI, pas figées par la
// config du node) — `config` ne sert plus que de valeur initiale.
export function PlanningWidget({ config }: PlanningWidgetProps) {
  const headerClassName = useModuleHeaderClassName('planning-week', 'green-600')
  const headerStyle = useModuleStyleId('planning-week', 'wave')
  const events = useLiveQuery(() => db.events.toArray(), []) ?? []
  const [daysCount, setDaysCount] = useState<5 | 7>(7)
  const [hourMode, setHourMode] = useState<PlanningMode>(config.mode)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [referenceDate, setReferenceDate] = useState(() => new Date())
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [selection, setSelection] = useState<TimeRangeSelection | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const days = useMemo(() => getWeekDays(referenceDate).slice(0, daysCount), [referenceDate, daysCount])

  // Une sélection de plage horaire finalisée dans WeekGrid ouvre directement
  // la modale, pré-remplie avec cette plage.
  const handleSelectionChange = useCallback((next: TimeRangeSelection | null) => {
    setSelection(next)
    if (next) setIsEventModalOpen(true)
  }, [])

  const handleNewEventClick = () => {
    setSelection(null)
    setIsEventModalOpen(true)
  }

  const handleEventModalOpenChange = (open: boolean) => {
    setIsEventModalOpen(open)
    if (!open) setSelection(null)
  }

  const goToPreviousWeek = () => setReferenceDate((d) => addDays(d, -7))
  const goToNextWeek = () => setReferenceDate((d) => addDays(d, 7))
  const goToToday = () => setReferenceDate(new Date())

  const handleFilesSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    let total = 0
    for (const file of files) {
      total += await importIcsEvents(await file.text())
    }
    setImportStatus(`${total} événement${total > 1 ? 's' : ''} importé${total > 1 ? 's' : ''}.`)
    setTimeout(() => setImportStatus(null), 4000)
    e.target.value = ''
  }

  // Un seul bouton en en-tête (cf. RADIAL_MENU.md) ouvre un menu radial
  // regroupant ce qui était jusque-là 5 boutons séparés. Label ET icône
  // décrivent la cible de l'action (pas l'état courant) — pertinent pour un
  // menu qui se referme après le clic, contrairement à un bouton persistant.
  const radialItems: RadialMenuItem[] = [
    { id: 'import-ics', label: 'Importer .ics', icon: <Upload />, onSelect: () => fileInputRef.current?.click() },
    { id: 'new-event', label: 'Nouvel événement', icon: <Plus />, onSelect: handleNewEventClick },
    ...(config.view === 'week'
      ? ([
          {
            id: 'toggle-days',
            label: daysCount === 7 ? 'Passer à 5 jours' : 'Passer à 7 jours',
            icon: daysCount === 7 ? <CalendarRange /> : <CalendarDays />,
            onSelect: () => setDaysCount((d) => (d === 7 ? 5 : 7)),
          },
          ...(viewMode !== 'minimal'
            ? [
                {
                  id: 'toggle-hours',
                  label: hourMode === 'extended' ? 'Horaires compacts (8h-19h)' : 'Horaires étendus (00h-24h)',
                  icon: hourMode === 'extended' ? <Briefcase /> : <Clock />,
                  onSelect: () => setHourMode((m) => (m === 'extended' ? 'compact' : 'extended')),
                },
              ]
            : []),
          {
            id: 'toggle-view-mode',
            label: viewMode === 'grid' ? 'Mode minimaliste' : 'Mode grille',
            icon: viewMode === 'grid' ? <Rows3 /> : <LayoutGrid />,
            onSelect: () => setViewMode((v) => (v === 'grid' ? 'minimal' : 'grid')),
          },
        ] satisfies RadialMenuItem[])
      : []),
  ]

  return (
    <ModuleRadialTrigger items={radialItems} variant="slide"> {/* values : slide or thread */}
      <input ref={fileInputRef} type="file" accept=".ics" multiple onChange={handleFilesSelected} className="hidden" />
      <ModuleCard
        className="w-[640px]"
        titleClassName="capitalize"
        headerClassName={headerClassName}
        variant={headerStyle}
        title={`Planning — ${config.view}`}
      >
        {importStatus && <p className="mb-2 text-xs text-muted-foreground">{importStatus}</p>}
        {config.view === 'week' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <ToolbarButton onClick={goToPreviousWeek} aria-label="Semaine précédente">
                  <ChevronLeft className="size-3.5" />
                </ToolbarButton>
                <span className="min-w-28 text-center text-xs text-muted-foreground">{formatWeekRange(days)}</span>
                <ToolbarButton onClick={goToNextWeek} aria-label="Semaine suivante">
                  <ChevronRight className="size-3.5" />
                </ToolbarButton>
              </div>
              <ToolbarButton onClick={goToToday} aria-label="Revenir à aujourd'hui" size="sm">
                Aujourd'hui
              </ToolbarButton>
            </div>
            {selection && <p className="text-xs text-muted-foreground">Sélection : {formatSelection(selection)}</p>}
            {viewMode === 'grid' ? (
              <WeekGrid
                events={events}
                mode={hourMode}
                days={days}
                selection={selection}
                onSelectionChange={handleSelectionChange}
              />
            ) : (
              <WeekMinimal events={events} days={days} />
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Vue « {config.view} » à implémenter.</p>
        )}
        <EventFormModal open={isEventModalOpen} onOpenChange={handleEventModalOpenChange} selection={selection} />
      </ModuleCard>
    </ModuleRadialTrigger>
  )
}
