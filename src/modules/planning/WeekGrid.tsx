import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { eventOccursOnDay, getDayLabel, isSameDay } from './date-utils'
import { sourceBorderClass, sourceLabelKey } from './source-style'
import type { CalendarEvent, PlanningMode, TimeRangeSelection } from './types'

interface WeekGridProps {
  events: CalendarEvent[]
  mode: PlanningMode
  days: Date[]
  selection: TimeRangeSelection | null
  onSelectionChange: (selection: TimeRangeSelection | null) => void
  onEventClick: (event: CalendarEvent) => void
}

const HOUR_HEIGHT = 40 // px
const GUTTER = '2.5rem'

// Clic sur un event ouvre sa modale de détail/édition (cf. le bloc event
// plus bas) — sélection d'une plage horaire par glisser déjà active pour la
// modale de création (cf. plus bas).
//
// En-tête et grille dans UN SEUL conteneur scrollable (en-tête `sticky`)
// plutôt que deux grids séparées : sinon la scrollbar du corps (qui prend de
// la largeur) désaligne les colonnes par rapport à l'en-tête, qui lui n'en a
// pas — un seul grid = une seule source de vérité pour la largeur des
// colonnes, plus de désalignement possible.
export function WeekGrid({ events, mode, days, selection, onSelectionChange, onEventClick }: WeekGridProps) {
  const { t, i18n } = useTranslation()
  // "compact" = heures de bureau condensées, "extended" = journée complète.
  const startHour = mode === 'compact' ? 8 : 0
  const endHour = mode === 'compact' ? 19 : 24
  const hours = useMemo(() => Array.from({ length: endHour - startHour }, (_, i) => startHour + i), [startHour, endHour])

  // `today` : la vraie date du jour, pour le surlignage — indépendant de la
  // semaine affichée (`days`), qui peut être passée/future après navigation.
  const today = useMemo(() => new Date(), [])

  const eventsByDay = useMemo(
    () => days.map((day) => events.filter((e) => !e.allDay && isSameDay(new Date(e.start), day))),
    [events, days],
  )
  const allDayEventsByDay = useMemo(
    () => days.map((day) => events.filter((e) => e.allDay && eventOccursOnDay(e, day))),
    [events, days],
  )
  const hasAllDayEvents = allDayEventsByDay.some((dayEvents) => dayEvents.length > 0)

  // Glisser pour sélectionner une plage horaire (comme Outlook/Google
  // Calendar) : le jour reste celui où le glisser a commencé même si la
  // souris dérive sur une colonne voisine — seule l'heure suit le curseur.
  const [dragDay, setDragDay] = useState<Date | null>(null)
  const [dragStartHour, setDragStartHour] = useState<number | null>(null)
  const [dragCurrentHour, setDragCurrentHour] = useState<number | null>(null)
  // Un simple clic (pas de glisser) qui démarre À L'INTÉRIEUR de la
  // sélection courante la désélectionne, plutôt que de la remplacer par une
  // sélection d'1h au même endroit.
  const [clickedInsideSelection, setClickedInsideSelection] = useState(false)

  // Navigation clavier (roving tabindex) : cellule "active" hors extension
  // en cours — indépendante de `dragDay`/`dragCurrentHour`, qui eux ne
  // servent que pendant une extension (souris OU clavier, cf. plus bas).
  const todayIndex = days.findIndex((day) => isSameDay(day, today))
  const [focusedDayIndex, setFocusedDayIndex] = useState(Math.max(todayIndex, 0))
  const [focusedHour, setFocusedHour] = useState(startHour)
  const cellRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const focusCell = (dayIndex: number, hour: number) => {
    cellRefs.current[`${dayIndex}-${hour}`]?.focus()
  }

  // Le canvas React Flow applique son propre `transform: scale(...)` (zoom) :
  // `getBoundingClientRect` renvoie donc une hauteur déjà mise à l'échelle,
  // différente des `HOUR_HEIGHT` px "locaux" utilisés pour le placement.
  // Sans correction, la conversion pixel-souris → heure dérive dès que le
  // canvas n'est pas exactement à 100 % de zoom. Le ratio hauteur
  // observée/hauteur locale connue donne l'échelle courante sans avoir à
  // lire l'état interne de React Flow.
  const hourFromEvent = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const scale = rect.height / (hours.length * HOUR_HEIGHT)
    const y = (e.clientY - rect.top) / scale
    const hourIndex = Math.min(Math.max(Math.floor(y / HOUR_HEIGHT), 0), hours.length - 1)
    return startHour + hourIndex
  }

  const handleMouseDown = (day: Date) => (e: ReactMouseEvent<HTMLDivElement>) => {
    const hour = hourFromEvent(e)
    setClickedInsideSelection(
      selection !== null && isSameDay(selection.day, day) && hour >= selection.startHour && hour < selection.endHour,
    )
    setDragDay(day)
    setDragStartHour(hour)
    setDragCurrentHour(hour)
    onSelectionChange(null)
  }

  const handleMouseMove = (day: Date) => (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragDay || !isSameDay(dragDay, day)) return
    setDragCurrentHour(hourFromEvent(e))
  }

  // Finalise la plage en cours (souris OU clavier) : réutilisée par le
  // listener `mouseup` ci-dessous et par la confirmation clavier (Entrée).
  const commitDrag = (day: Date, start: number, current: number) => {
    const wasJustAClick = start === current
    onSelectionChange(
      wasJustAClick && clickedInsideSelection
        ? null
        : { day, startHour: Math.min(start, current), endHour: Math.max(start, current) + 1 },
    )
    setDragDay(null)
    setDragStartHour(null)
    setDragCurrentHour(null)
    setClickedInsideSelection(false)
  }

  useEffect(() => {
    if (dragDay === null || dragStartHour === null || dragCurrentHour === null) return
    const handleUp = () => commitDrag(dragDay, dragStartHour, dragCurrentHour)
    window.addEventListener('mouseup', handleUp)
    return () => window.removeEventListener('mouseup', handleUp)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragDay, dragStartHour, dragCurrentHour, clickedInsideSelection, onSelectionChange])

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

  // Navigation/extension clavier sur une cellule (jour, heure) donnée —
  // mêmes états `dragDay`/`dragStartHour`/`dragCurrentHour` que le
  // glisser-souris, alimentés ici par Maj+Flèche au lieu de mousemove.
  const handleCellKeyDown = (day: Date, dayIndex: number, hour: number) => (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    const isExtending = dragDay !== null && isSameDay(dragDay, day)

    // React Flow écoute lui aussi les flèches (déplacement du node
    // sélectionné) sur un listener global : sans `stopPropagation`, nos
    // touches de navigation/extension font aussi glisser tout le widget
    // Planning sur le canvas.
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape'].includes(e.key)) {
      e.stopPropagation()
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const delta = e.key === 'ArrowDown' ? 1 : -1
      if (e.shiftKey) {
        const anchor = isExtending ? dragStartHour! : hour
        const current = isExtending ? dragCurrentHour! : hour
        const nextCurrent = clamp(current + delta, startHour, endHour - 1)
        setClickedInsideSelection(false)
        setDragDay(day)
        setDragStartHour(anchor)
        setDragCurrentHour(nextCurrent)
        focusCell(dayIndex, nextCurrent)
      } else {
        const nextHour = clamp(hour + delta, startHour, endHour - 1)
        setFocusedDayIndex(dayIndex)
        setFocusedHour(nextHour)
        focusCell(dayIndex, nextHour)
      }
      return
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      if (e.shiftKey) return // extension limitée au jour courant, comme le glisser-souris
      e.preventDefault()
      const nextDayIndex = clamp(dayIndex + (e.key === 'ArrowRight' ? 1 : -1), 0, days.length - 1)
      setFocusedDayIndex(nextDayIndex)
      setFocusedHour(hour)
      focusCell(nextDayIndex, hour)
      return
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (isExtending) {
        // Resynchronise le focus roving sur la cellule où le focus DOM se
        // trouve réellement (celle de `dragCurrentHour`), sinon un Tab hors
        // puis retour dans la grille sauterait sur l'ancienne cellule
        // d'avant l'extension.
        setFocusedDayIndex(dayIndex)
        setFocusedHour(dragCurrentHour!)
        commitDrag(dragDay, dragStartHour!, dragCurrentHour!)
      } else {
        onSelectionChange({ day, startHour: hour, endHour: hour + 1 })
      }
      return
    }

    if (e.key === 'Escape' && isExtending) {
      e.preventDefault()
      setFocusedDayIndex(dayIndex)
      setFocusedHour(dragCurrentHour!)
      setDragDay(null)
      setDragStartHour(null)
      setDragCurrentHour(null)
      setClickedInsideSelection(false)
    }
  }

  const handleHeaderClick = (day: Date) => () => {
    const isFullDaySelected =
      selection !== null && isSameDay(selection.day, day) && selection.startHour === startHour && selection.endHour === endHour
    onSelectionChange(isFullDaySelected ? null : { day, startHour, endHour })
  }

  const columns = `${GUTTER} repeat(${days.length}, 1fr)`
  const instructionsId = useId()

  // Plus de `tabIndex={0}` ici : chaque cellule horaire est désormais un
  // bouton focusable (cf. plus bas), la grille a donc toujours au moins un
  // descendant joignable au clavier, contrairement au constat de l'audit
  // accessibilité du 2026-08-19 qui avait motivé ce `tabIndex` sur le
  // conteneur (calendrier vide = aucun descendant focusable, à l'époque).
  return (
    <div className="nowheel max-h-96 overflow-y-auto text-xs">
      <p id={instructionsId} className="sr-only">
        {t('planning.grid.instructions')}
      </p>
      <div className="grid" style={{ gridTemplateColumns: columns }}>
        <div className="sticky top-0 z-10 border-b bg-card" />
        {days.map((day, i) => (
          <div
            key={i}
            onClick={handleHeaderClick(day)}
            className={cn(
              'sticky top-0 z-10 cursor-pointer border-b border-l bg-card px-1 py-1 text-center select-none hover:bg-muted',
              isSameDay(day, today) && 'bg-primary/10 font-semibold',
            )}
          >
            {/* `text-foreground` sur le jour surligné : `text-muted-foreground`
                seul tombait sous le contraste WCAG AA une fois posé sur
                `bg-primary/10` (3.86:1 mesuré), cf. audit accessibilité du
                2026-08-19. */}
            <div className={cn(isSameDay(day, today) ? 'text-foreground' : 'text-muted-foreground')}>
              {getDayLabel(day, i18n.language)}
            </div>
            <div>{day.getDate()}</div>
          </div>
        ))}

        {hasAllDayEvents && (
          <>
            <div className="border-b" />
            {days.map((_, dayIndex) => (
              <div key={`allday-${dayIndex}`} className="flex flex-col gap-0.5 border-b border-l p-0.5">
                {allDayEventsByDay[dayIndex].map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick(event)
                    }}
                    title={t('planning.event.view', { source: t(sourceLabelKey(event.source)) })}
                    className={cn(
                      'block w-full truncate rounded-sm border-l-4 bg-green-200 px-1 py-0.5 text-left text-[10px] text-green-900 hover:ring-1 hover:ring-primary',
                      sourceBorderClass(event.source),
                    )}
                    style={{ backgroundColor: event.color }}
                  >
                    {event.title}
                  </button>
                ))}
              </div>
            ))}
          </>
        )}

        <div>
          {hours.map((h) => (
            <div key={h} style={{ height: HOUR_HEIGHT }} className="pr-1 text-right text-muted-foreground">
              {String(h).padStart(2, '0')}h
            </div>
          ))}
        </div>
        {days.map((day, dayIndex) => {
          const isDraggingThisDay = dragDay !== null && isSameDay(dragDay, day)
          const range = isDraggingThisDay
            ? { start: Math.min(dragStartHour!, dragCurrentHour!), end: Math.max(dragStartHour!, dragCurrentHour!) + 1 }
            : selection && isSameDay(selection.day, day)
              ? { start: selection.startHour, end: selection.endHour }
              : null

          const dayLabel = new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }).format(
            day,
          )

          return (
            <div
              key={dayIndex}
              onMouseDown={handleMouseDown(day)}
              onMouseMove={handleMouseMove(day)}
              className={cn('relative cursor-pointer border-l select-none', isSameDay(day, today) && 'bg-primary/5')}
              style={{ height: hours.length * HOUR_HEIGHT }}
            >
              {hours.map((h) => {
                const isActive = isDraggingThisDay
                  ? h === dragCurrentHour
                  : dayIndex === focusedDayIndex && h === focusedHour
                const isSelected = range !== null && h >= range.start && h < range.end
                return (
                  <button
                    key={h}
                    type="button"
                    ref={(el) => {
                      cellRefs.current[`${dayIndex}-${h}`] = el
                    }}
                    tabIndex={isActive ? 0 : -1}
                    onKeyDown={handleCellKeyDown(day, dayIndex, h)}
                    onFocus={() => {
                      if (!isDraggingThisDay) {
                        setFocusedDayIndex(dayIndex)
                        setFocusedHour(h)
                      }
                    }}
                    aria-label={t(isSelected ? 'planning.grid.cellLabelSelected' : 'planning.grid.cellLabel', {
                      day: dayLabel,
                      hour: h,
                    })}
                    aria-describedby={instructionsId}
                    className="focus-visible:ring-primary block w-full appearance-none border-b bg-transparent p-0 text-left focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none"
                    style={{ height: HOUR_HEIGHT }}
                  />
                )
              })}
              {range && (
                <div
                  className="pointer-events-none absolute inset-x-0.5 rounded-sm bg-blue-400/30 ring-1 ring-blue-500"
                  style={{
                    top: (range.start - startHour) * HOUR_HEIGHT,
                    height: (range.end - range.start) * HOUR_HEIGHT,
                  }}
                />
              )}
              {eventsByDay[dayIndex].map((event) => {
                const start = new Date(event.start)
                const end = new Date(event.end)
                // Décalage de fin en heures depuis le début du JOUR AFFICHÉ (pas
                // juste `end.getHours()`, qui perdrait l'info si l'event finit
                // le lendemain — ex. un event de 24h pile).
                const daysBetween = Math.round(
                  (new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime() -
                    new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) /
                    86_400_000,
                )
                const rawStart = start.getHours() + start.getMinutes() / 60 - startHour
                const rawEnd = daysBetween * 24 + end.getHours() + end.getMinutes() / 60 - startHour
                // Bornée à la plage affichée (0..hours.length) : sans ça, un
                // event qui déborde de la fenêtre (ex. plage compacte 8h-19h
                // avec un event sur toute la journée) rendait un bloc bien plus
                // grand que la grille, avec le titre poussé hors de vue.
                const clampedStart = Math.max(rawStart, 0)
                const clampedEnd = Math.min(rawEnd, hours.length)
                return (
                  <button
                    key={event.id}
                    type="button"
                    // `stopPropagation` sur mousedown ET click : sans ça, le
                    // clic traverse jusqu'à la cellule en dessous (l'event est
                    // positionné par-dessus, pas dans le flux) et déclenche la
                    // logique de sélection par glisser du parent — un simple
                    // clic sur un event ouvrait donc la modale de CRÉATION
                    // d'un nouvel event au lieu de cibler celui-ci.
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick(event)
                    }}
                    title={t('planning.event.view', { source: t(sourceLabelKey(event.source)) })}
                    className={cn(
                      'absolute inset-x-0.5 block overflow-hidden rounded-sm border-l-4 bg-green-200 px-1 py-0.5 text-left text-[10px] text-green-900 hover:ring-1 hover:ring-primary',
                      sourceBorderClass(event.source),
                    )}
                    style={{
                      top: clampedStart * HOUR_HEIGHT,
                      height: Math.max((clampedEnd - clampedStart) * HOUR_HEIGHT, 16),
                      backgroundColor: event.color,
                    }}
                  >
                    {event.title}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
