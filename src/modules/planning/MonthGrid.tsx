import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { addDays, DAY_LABELS, isSameDay } from './date-utils'
import { sourceBorderClass, sourceLabel } from './source-style'
import type { CalendarEvent, PlanningMode } from './types'

interface MonthGridProps {
  events: CalendarEvent[]
  mode: PlanningMode
  days: Date[] // 42 jours (getMonthGridDays) : 6 semaines pleines, bordées par les mois adjacents
  referenceDate: Date // pour griser les jours hors du mois courant
  onDayClick: (day: Date) => void
  onEventClick: (event: CalendarEvent) => void
}

const MAX_TITLES = 3

// Chevauchement `[event.start, event.end)` avec `[jour 00h, jour+1 00h)`
// plutôt qu'un simple `isSameDay(start, day)` : un event `allDay` multi-jours
// (fin exclusive, même convention que l'import .ics) doit apparaître sur
// chaque jour qu'il couvre, pas seulement son jour de départ.
function eventOccursOnDay(event: CalendarEvent, day: Date): boolean {
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = addDays(dayStart, 1)
  const start = new Date(event.start)
  const end = new Date(event.end)
  return start < dayEnd && end > dayStart
}

// Pas d'état de drag ici (contrairement à WeekGrid) : un clic sur une case
// produit directement une sélection finale journée entière, il n'y a pas de
// plage horaire à affiner par glisser sur un axe qui n'existe pas.
export function MonthGrid({ events, mode, days, referenceDate, onDayClick, onEventClick }: MonthGridProps) {
  const today = useMemo(() => new Date(), [])
  const currentMonth = referenceDate.getMonth()

  const eventsByDay = useMemo(
    () => days.map((day) => events.filter((e) => eventOccursOnDay(e, day))),
    [events, days],
  )

  return (
    <div className="nowheel max-h-96 overflow-y-auto text-xs">
      <div className="grid grid-cols-7">
        {DAY_LABELS.map((label) => (
          <div key={label} className="sticky top-0 z-10 border-b bg-card px-1 py-1 text-center text-muted-foreground">
            {label}
          </div>
        ))}
        {days.map((day, i) => {
          const dayEvents = eventsByDay[i]
          const isOutsideMonth = day.getMonth() !== currentMonth
          const overflowCount = dayEvents.length - MAX_TITLES

          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className={cn(
                'flex min-h-16 cursor-pointer flex-col gap-0.5 border-b border-l p-1 select-none hover:bg-muted',
                isSameDay(day, today) && 'bg-primary/10',
                isOutsideMonth && 'text-muted-foreground/50',
              )}
            >
              <div className={cn(isSameDay(day, today) && 'font-semibold')}>{day.getDate()}</div>
              {mode === 'extended' ? (
                <>
                  {dayEvents.slice(0, MAX_TITLES).map((event) => (
                    <div
                      key={event.id}
                      // La case entière ouvre la création d'un event (clic sur
                      // une zone vide) — sans stopPropagation, cliquer une
                      // chip remonterait aussi ce clic à la case et ouvrirait
                      // la modale de création en plus de celle d'édition.
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(event)
                      }}
                      title={`Voir l'événement (${sourceLabel(event.source)})`}
                      className={cn(
                        'truncate rounded-sm border-l-4 bg-green-200 px-1 py-0.5 text-[10px] text-green-900 hover:ring-1 hover:ring-primary',
                        sourceBorderClass(event.source),
                      )}
                      style={{ backgroundColor: event.color }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {overflowCount > 0 && <div className="text-[10px] text-muted-foreground">+{overflowCount}</div>}
                </>
              ) : (
                dayEvents.length > 0 && (
                  <div className="flex size-4 items-center justify-center rounded-full bg-primary/20 text-[10px] font-medium">
                    {dayEvents.length}
                  </div>
                )
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
