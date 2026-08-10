import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useReactFlow } from '@xyflow/react'
import {
  Briefcase,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dot,
  LayoutGrid,
  List,
  Plus,
  Rows3,
  Upload,
} from 'lucide-react'
import { ModuleCard } from '@/components/module-card'
import { useModuleHeaderClassName } from '@/canvas/module-theme'
import { useModuleNavigation } from '@/canvas/module-navigation'
import { useModuleStyleId } from '@/canvas/module-style'
import { db } from '@/lib/db'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import { addDays, addMonths, formatDayLabel, formatMonthYear, formatWeekRange, getMonthGridDays, getWeekDays } from './date-utils'
import { EventFormModal } from './EventFormModal'
import { importIcsEvents } from './ics-import'
import { MonthGrid } from './MonthGrid'
import { WeekGrid } from './WeekGrid'
import { WeekMinimal } from './WeekMinimal'
import type { CalendarEvent, PlanningMode, PlanningView, PlanningWidgetConfig, TimeRangeSelection } from './types'

const SELECTION_DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

function formatSelection(selection: TimeRangeSelection): string {
  if (selection.allDay) return `Journée entière, ${SELECTION_DATE_FORMAT.format(selection.day)}`
  return `${String(selection.startHour).padStart(2, '0')}h–${String(selection.endHour).padStart(2, '0')}h, ${SELECTION_DATE_FORMAT.format(selection.day)}`
}

interface PlanningWidgetProps {
  config: PlanningWidgetConfig
}

type ViewMode = 'grid' | 'minimal'

// `view`/`daysCount`/`hourMode`/`viewMode`/`referenceDate` sont des options
// d'affichage propres à ce widget (choisies dans l'UI, pas figées par la
// config du node) — `config` ne sert plus que de valeur initiale.
export function PlanningWidget({ config }: PlanningWidgetProps) {
  const headerClassName = useModuleHeaderClassName('planning-week', 'green-600')
  const headerStyle = useModuleStyleId('planning-week', 'wave')
  const events = useLiveQuery(() => db.events.toArray(), []) ?? []
  const [view, setView] = useState<PlanningView>(config.view)
  const [daysCount, setDaysCount] = useState<5 | 7>(7)
  const [hourMode, setHourMode] = useState<PlanningMode>(config.mode)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [referenceDate, setReferenceDate] = useState(() => new Date())
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [selection, setSelection] = useState<TimeRangeSelection | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Vue mois recalée au 1er du mois par `addMonths` : si on navigue en mois
  // puis revient en jour/semaine, `referenceDate` pointe le 1er du mois
  // affiché (un seul état de référence partagé entre les 3 vues plutôt
  // qu'un état par vue — compromis assumé pour ne pas complexifier ce state).
  const days = useMemo(
    () => (view === 'day' ? [referenceDate] : getWeekDays(referenceDate).slice(0, daysCount)),
    [view, referenceDate, daysCount],
  )
  const monthDays = useMemo(() => getMonthGridDays(referenceDate), [referenceDate])

  // Un autre widget (Important) peut demander à afficher un événement
  // précis : on bascule en vue jour sur sa date (la plus précise pour
  // repérer un event isolé) et on recentre le canvas sur ce widget fixe
  // (id `planning-week`, cf. HubCanvas) pour que le résultat soit visible
  // même si le widget était hors écran.
  const { request, consumeOpenRequest } = useModuleNavigation()
  const { fitView } = useReactFlow()
  useEffect(() => {
    if (request?.module !== 'planning') return
    db.events.get(request.id).then((event) => {
      if (event) {
        setReferenceDate(new Date(event.start))
        setView('day')
      }
      fitView({ nodes: [{ id: 'planning-week' }], duration: 300, maxZoom: 1 })
      consumeOpenRequest()
    })
  }, [request])

  // Une sélection de plage horaire finalisée dans WeekGrid ouvre directement
  // la modale, pré-remplie avec cette plage.
  const handleSelectionChange = useCallback((next: TimeRangeSelection | null) => {
    setSelection(next)
    if (next) setIsEventModalOpen(true)
  }, [])

  const handleNewEventClick = () => {
    setSelection(null)
    setEditingEvent(null)
    setIsEventModalOpen(true)
  }

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelection(null)
    setEditingEvent(event)
    setIsEventModalOpen(true)
  }, [])

  const handleEventModalOpenChange = (open: boolean) => {
    setIsEventModalOpen(open)
    if (!open) {
      setSelection(null)
      setEditingEvent(null)
    }
  }

  const handleMonthDayClick = useCallback(
    (day: Date) => handleSelectionChange({ day, startHour: 0, endHour: 24, allDay: true }),
    [handleSelectionChange],
  )

  const goToPrevious = () =>
    setReferenceDate((d) => (view === 'day' ? addDays(d, -1) : view === 'week' ? addDays(d, -7) : addMonths(d, -1)))
  const goToNext = () =>
    setReferenceDate((d) => (view === 'day' ? addDays(d, 1) : view === 'week' ? addDays(d, 7) : addMonths(d, 1)))
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

  const navLabel =
    view === 'day' ? formatDayLabel(referenceDate) : view === 'week' ? formatWeekRange(days) : formatMonthYear(referenceDate)
  const previousLabel = view === 'day' ? 'Jour précédent' : view === 'week' ? 'Semaine précédente' : 'Mois précédent'
  const nextLabel = view === 'day' ? 'Jour suivant' : view === 'week' ? 'Semaine suivante' : 'Mois suivant'

  return (
    <ModuleCard
      className="w-[640px]"
      titleClassName="capitalize"
      headerClassName={headerClassName}
      variant={headerStyle}
      title={`Planning — ${view}`}
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
          <ToolbarButton active={view === 'day'} size="sm" onClick={() => setView('day')} aria-label="Vue jour">
            Jour
          </ToolbarButton>
          <ToolbarButton active={view === 'week'} size="sm" onClick={() => setView('week')} aria-label="Vue semaine">
            Semaine
          </ToolbarButton>
          <ToolbarButton active={view === 'month'} size="sm" onClick={() => setView('month')} aria-label="Vue mois">
            Mois
          </ToolbarButton>
          {view === 'week' && (
            <ToolbarButton
              onClick={() => setDaysCount((d) => (d === 7 ? 5 : 7))}
              aria-label={daysCount === 7 ? 'Passer à 5 jours' : 'Passer à 7 jours'}
            >
              {daysCount === 7 ? <CalendarDays className="size-3.5" /> : <CalendarRange className="size-3.5" />}
            </ToolbarButton>
          )}
          {view !== 'month' ? (
            <ToolbarButton
              onClick={() => setHourMode((m) => (m === 'extended' ? 'compact' : 'extended'))}
              disabled={viewMode === 'minimal'}
              aria-label={hourMode === 'extended' ? 'Passer en horaires compacts (8h-19h)' : 'Passer en horaires étendus (00h-24h)'}
            >
              {hourMode === 'extended' ? <Clock className="size-3.5" /> : <Briefcase className="size-3.5" />}
            </ToolbarButton>
          ) : (
            <ToolbarButton
              onClick={() => setHourMode((m) => (m === 'extended' ? 'compact' : 'extended'))}
              aria-label={hourMode === 'extended' ? 'Afficher un indicateur au lieu des titres' : 'Afficher les titres des événements'}
            >
              {hourMode === 'extended' ? <List className="size-3.5" /> : <Dot className="size-3.5" />}
            </ToolbarButton>
          )}
          {view !== 'month' && (
            <ToolbarButton
              onClick={() => setViewMode((v) => (v === 'grid' ? 'minimal' : 'grid'))}
              aria-label={viewMode === 'grid' ? 'Passer en mode minimaliste' : 'Passer en mode grille'}
            >
              {viewMode === 'grid' ? <Rows3 className="size-3.5" /> : <LayoutGrid className="size-3.5" />}
            </ToolbarButton>
          )}
        </>
      }
    >
      {importStatus && <p className="mb-2 text-xs text-muted-foreground">{importStatus}</p>}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <ToolbarButton onClick={goToPrevious} aria-label={previousLabel}>
              <ChevronLeft className="size-3.5" />
            </ToolbarButton>
            <span className="min-w-28 text-center text-xs text-muted-foreground capitalize">{navLabel}</span>
            <ToolbarButton onClick={goToNext} aria-label={nextLabel}>
              <ChevronRight className="size-3.5" />
            </ToolbarButton>
          </div>
          <ToolbarButton onClick={goToToday} aria-label="Revenir à aujourd'hui" size="sm">
            Aujourd'hui
          </ToolbarButton>
        </div>
        {selection && <p className="text-xs text-muted-foreground">Sélection : {formatSelection(selection)}</p>}
        {view === 'month' ? (
          <MonthGrid
            events={events}
            mode={hourMode}
            days={monthDays}
            referenceDate={referenceDate}
            onDayClick={handleMonthDayClick}
            onEventClick={handleEventClick}
          />
        ) : viewMode === 'grid' ? (
          <WeekGrid
            events={events}
            mode={hourMode}
            days={days}
            selection={selection}
            onSelectionChange={handleSelectionChange}
            onEventClick={handleEventClick}
          />
        ) : (
          <WeekMinimal events={events} days={days} onEventClick={handleEventClick} />
        )}
      </div>
      <EventFormModal
        open={isEventModalOpen}
        onOpenChange={handleEventModalOpenChange}
        selection={selection}
        event={editingEvent}
      />
    </ModuleCard>
  )
}
