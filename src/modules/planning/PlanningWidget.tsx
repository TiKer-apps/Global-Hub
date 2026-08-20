import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
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
import { useIsMobile } from '@/canvas/use-is-mobile'
import { db } from '@/lib/db'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import { PlanningActionsMenu, type PlanningAction } from './PlanningActionsMenu'
import {
  addDays,
  addMonths,
  eventOccursOnDay,
  formatDayLabel,
  formatMonthYear,
  formatWeekRange,
  getMonthGridDays,
  getWeekDays,
  toIntlLocale,
} from './date-utils'
import { DayDetailModal } from './DayDetailModal'
import { EventFormModal } from './EventFormModal'
import { importIcsEvents } from './ics-import'
import { MonthGrid } from './MonthGrid'
import { WeekGrid } from './WeekGrid'
import { WeekMinimal } from './WeekMinimal'
import type { CalendarEvent, PlanningMode, PlanningView, PlanningWidgetConfig, TimeRangeSelection } from './types'

function formatSelection(selection: TimeRangeSelection, language: string, t: TFunction): string {
  const date = new Intl.DateTimeFormat(toIntlLocale(language), { weekday: 'short', day: 'numeric', month: 'short' }).format(
    selection.day,
  )
  if (selection.allDay) return t('planning.selection.allDay', { date })
  return t('planning.selection.range', {
    start: String(selection.startHour).padStart(2, '0'),
    end: String(selection.endHour).padStart(2, '0'),
    date,
  })
}

interface PlanningWidgetProps {
  config: PlanningWidgetConfig
}

type ViewMode = 'grid' | 'minimal'

// `view`/`daysCount`/`hourMode`/`viewMode`/`referenceDate` sont des options
// d'affichage propres à ce widget (choisies dans l'UI, pas figées par la
// config du node) — `config` ne sert plus que de valeur initiale.
export function PlanningWidget({ config }: PlanningWidgetProps) {
  const { t, i18n } = useTranslation()
  const isMobile = useIsMobile()
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
  const [dayDetailDate, setDayDetailDate] = useState<Date | null>(null)
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

  // Une case déjà chargée (au moins un event ce jour-là) ouvre le détail du
  // jour plutôt que la création directe — c'est aussi le seul moyen de voir
  // les events au-delà des `MAX_TITLES` premiers titres affichés par
  // MonthGrid (clic sur le badge "+N", qui remonte au clic de la case).
  // Une case vide garde le chemin rapide existant (création immédiate).
  const handleMonthDayClick = useCallback(
    (day: Date) => {
      const hasEvents = events.some((e) => eventOccursOnDay(e, day))
      if (hasEvents) setDayDetailDate(day)
      else handleSelectionChange({ day, startHour: 0, endHour: 24, allDay: true })
    },
    [events, handleSelectionChange],
  )

  const dayDetailEvents = useMemo(() => {
    if (!dayDetailDate) return []
    return events
      .filter((e) => eventOccursOnDay(e, dayDetailDate))
      .sort((a, b) =>
        a.allDay === b.allDay ? new Date(a.start).getTime() - new Date(b.start).getTime() : a.allDay ? -1 : 1,
      )
  }, [events, dayDetailDate])

  const handleDayDetailEventClick = (event: CalendarEvent) => {
    setDayDetailDate(null)
    handleEventClick(event)
  }

  const handleDayDetailCreateEvent = () => {
    const day = dayDetailDate
    setDayDetailDate(null)
    if (day) handleSelectionChange({ day, startHour: 0, endHour: 24, allDay: true })
  }

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
    setImportStatus(t('planning.importStatus', { count: total }))
    setTimeout(() => setImportStatus(null), 4000)
    e.target.value = ''
  }

  const navLabel =
    view === 'day'
      ? formatDayLabel(referenceDate, i18n.language)
      : view === 'week'
        ? formatWeekRange(days, i18n.language)
        : formatMonthYear(referenceDate, i18n.language)
  const previousLabel = t(
    view === 'day' ? 'planning.nav.previousDay' : view === 'week' ? 'planning.nav.previousWeek' : 'planning.nav.previousMonth',
  )
  const nextLabel = t(
    view === 'day' ? 'planning.nav.nextDay' : view === 'week' ? 'planning.nav.nextWeek' : 'planning.nav.nextMonth',
  )

  // Un seul tableau consommé par les deux rendus ci-dessous : la rangée
  // desktop (ToolbarButton, inchangée) et le menu radial mobile
  // (PlanningActionsMenu) — évite de dupliquer ces conditions (view/
  // daysCount/hourMode/viewMode) dans deux JSX séparés.
  const actions: PlanningAction[] = [
    {
      id: 'import',
      ariaLabel: t('planning.toolbar.importIcs'),
      icon: <Upload className="size-3.5" />,
      onClick: () => fileInputRef.current?.click(),
    },
    {
      id: 'new-event',
      ariaLabel: t('planning.toolbar.newEvent'),
      icon: <Plus className="size-3.5" />,
      onClick: handleNewEventClick,
    },
    {
      id: 'view-day',
      ariaLabel: t('planning.toolbar.viewDay'),
      icon: t('planning.view.day'),
      onClick: () => setView('day'),
      active: view === 'day',
    },
    {
      id: 'view-week',
      ariaLabel: t('planning.toolbar.viewWeek'),
      icon: t('planning.view.week'),
      onClick: () => setView('week'),
      active: view === 'week',
    },
    {
      id: 'view-month',
      ariaLabel: t('planning.toolbar.viewMonth'),
      icon: t('planning.view.month'),
      onClick: () => setView('month'),
      active: view === 'month',
    },
    ...(view === 'week'
      ? [
          {
            id: 'days-count',
            ariaLabel: t(daysCount === 7 ? 'planning.toolbar.daysCountTo5' : 'planning.toolbar.daysCountTo7'),
            icon: daysCount === 7 ? <CalendarDays className="size-3.5" /> : <CalendarRange className="size-3.5" />,
            onClick: () => setDaysCount((d) => (d === 7 ? 5 : 7)),
          },
        ]
      : []),
    view !== 'month'
      ? {
          id: 'hour-mode',
          ariaLabel: t(hourMode === 'extended' ? 'planning.toolbar.hourModeCompact' : 'planning.toolbar.hourModeExtended'),
          icon: hourMode === 'extended' ? <Clock className="size-3.5" /> : <Briefcase className="size-3.5" />,
          onClick: () => setHourMode((m) => (m === 'extended' ? 'compact' : 'extended')),
          disabled: viewMode === 'minimal',
        }
      : {
          id: 'hour-mode',
          ariaLabel: t(hourMode === 'extended' ? 'planning.toolbar.monthModeIndicator' : 'planning.toolbar.monthModeTitles'),
          icon: hourMode === 'extended' ? <List className="size-3.5" /> : <Dot className="size-3.5" />,
          onClick: () => setHourMode((m) => (m === 'extended' ? 'compact' : 'extended')),
        },
    ...(view !== 'month'
      ? [
          {
            id: 'view-mode',
            ariaLabel: t(viewMode === 'grid' ? 'planning.toolbar.viewModeMinimal' : 'planning.toolbar.viewModeGrid'),
            icon: viewMode === 'grid' ? <Rows3 className="size-3.5" /> : <LayoutGrid className="size-3.5" />,
            onClick: () => setViewMode((v) => (v === 'grid' ? 'minimal' : 'grid')),
          },
        ]
      : []),
  ]

  return (
    <ModuleCard
      className="w-full md:w-[640px]"
      titleClassName="capitalize"
      headerClassName={headerClassName}
      variant={headerStyle}
      title={t('planning.title', { view: t(`planning.view.${view}`) })}
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
          {isMobile ? (
            <PlanningActionsMenu actions={actions} />
          ) : (
            actions.map((a) => (
              <ToolbarButton
                key={a.id}
                active={a.active}
                disabled={a.disabled}
                size={a.id.startsWith('view-') && a.id !== 'view-mode' ? 'sm' : undefined}
                onClick={a.onClick}
                aria-label={a.ariaLabel}
              >
                {a.icon}
              </ToolbarButton>
            ))
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
          <ToolbarButton onClick={goToToday} aria-label={t('planning.toolbar.today')} size="sm">
            {t('planning.toolbar.today')}
          </ToolbarButton>
        </div>
        {selection && (
          <p className="text-xs text-muted-foreground">
            {t('planning.selection.label', { value: formatSelection(selection, i18n.language, t) })}
          </p>
        )}
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
      <DayDetailModal
        open={dayDetailDate !== null}
        onOpenChange={(open) => !open && setDayDetailDate(null)}
        day={dayDetailDate}
        events={dayDetailEvents}
        onEventClick={handleDayDetailEventClick}
        onCreateEvent={handleDayDetailCreateEvent}
      />
    </ModuleCard>
  )
}
