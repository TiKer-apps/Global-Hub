import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { cn } from '@/lib/utils'
import { db } from '@/lib/db'
import { getDayLabel, isSameDay } from './date-utils'
import type { CalendarEvent, PlanningMode, TimeRangeSelection } from './types'

interface WeekGridProps {
  events: CalendarEvent[]
  mode: PlanningMode
  days: Date[]
  selection: TimeRangeSelection | null
  onSelectionChange: (selection: TimeRangeSelection | null) => void
}

const HOUR_HEIGHT = 40 // px
const GUTTER = '2.5rem'

// Pas d'édition/déplacement au clic sur un event (juste suppression, cf. le
// bloc event plus bas) — mais sélection d'une plage horaire par glisser déjà
// active (cf. plus bas), pour la modale de création.
//
// En-tête et grille dans UN SEUL conteneur scrollable (en-tête `sticky`)
// plutôt que deux grids séparées : sinon la scrollbar du corps (qui prend de
// la largeur) désaligne les colonnes par rapport à l'en-tête, qui lui n'en a
// pas — un seul grid = une seule source de vérité pour la largeur des
// colonnes, plus de désalignement possible.
export function WeekGrid({ events, mode, days, selection, onSelectionChange }: WeekGridProps) {
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

  useEffect(() => {
    if (dragDay === null || dragStartHour === null || dragCurrentHour === null) return
    const handleUp = () => {
      const wasJustAClick = dragStartHour === dragCurrentHour
      onSelectionChange(
        wasJustAClick && clickedInsideSelection
          ? null
          : {
              day: dragDay,
              startHour: Math.min(dragStartHour, dragCurrentHour),
              endHour: Math.max(dragStartHour, dragCurrentHour) + 1,
            },
      )
      setDragDay(null)
      setDragStartHour(null)
      setDragCurrentHour(null)
      setClickedInsideSelection(false)
    }
    window.addEventListener('mouseup', handleUp)
    return () => window.removeEventListener('mouseup', handleUp)
  }, [dragDay, dragStartHour, dragCurrentHour, clickedInsideSelection, onSelectionChange])

  const handleHeaderClick = (day: Date) => () => {
    const isFullDaySelected =
      selection !== null && isSameDay(selection.day, day) && selection.startHour === startHour && selection.endHour === endHour
    onSelectionChange(isFullDaySelected ? null : { day, startHour, endHour })
  }

  const columns = `${GUTTER} repeat(${days.length}, 1fr)`

  return (
    <div className="nowheel max-h-96 overflow-y-auto text-xs">
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
            <div className="text-muted-foreground">{getDayLabel(day)}</div>
            <div>{day.getDate()}</div>
          </div>
        ))}

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

          return (
            <div
              key={dayIndex}
              onMouseDown={handleMouseDown(day)}
              onMouseMove={handleMouseMove(day)}
              className={cn('relative cursor-pointer border-l select-none', isSameDay(day, today) && 'bg-primary/5')}
              style={{ height: hours.length * HOUR_HEIGHT }}
            >
              {hours.map((h) => (
                <div key={h} className="border-b" style={{ height: HOUR_HEIGHT }} />
              ))}
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
                  <div
                    key={event.id}
                    // `stopPropagation` sur mousedown ET click : sans ça, le
                    // clic traverse jusqu'à la cellule en dessous (l'event est
                    // positionné par-dessus, pas dans le flux) et déclenche la
                    // logique de sélection par glisser du parent — un simple
                    // clic sur un event ouvrait donc la modale de CRÉATION
                    // d'un nouvel event au lieu de cibler celui-ci.
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Supprimer « ${event.title} » ?`)) db.events.delete(event.id)
                    }}
                    title="Cliquer pour supprimer"
                    className="absolute inset-x-0.5 cursor-pointer overflow-hidden rounded-sm bg-green-200 px-1 py-0.5 text-[10px] text-green-900 hover:ring-1 hover:ring-red-500"
                    style={{
                      top: clampedStart * HOUR_HEIGHT,
                      height: Math.max((clampedEnd - clampedStart) * HOUR_HEIGHT, 16),
                      backgroundColor: event.color,
                    }}
                  >
                    {event.title}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
