import { useCallback, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Briefcase, CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Clock, LayoutGrid, Plus, Rows3, Upload } from 'lucide-react'
import { ModuleCard } from '@/components/module-card'
import { useModuleHeaderClassName } from '@/canvas/module-theme'
import { useModuleStyleId } from '@/canvas/module-style'
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

  return (
    <ModuleCard
      className="w-[640px]"
      titleClassName="capitalize"
      headerClassName={headerClassName}
      variant={headerStyle}
      title={`Planning — ${config.view}`}
      action={
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".ics"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
          />
          <ToolbarButton onClick={() => fileInputRef.current?.click()} aria-label="Importer un fichier .ics">
            <Upload className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={handleNewEventClick} aria-label="Nouvel événement">
            <Plus className="size-3.5" />
          </ToolbarButton>
          {config.view === 'week' && (
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
          )}
        </>
      }
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
  )
}
