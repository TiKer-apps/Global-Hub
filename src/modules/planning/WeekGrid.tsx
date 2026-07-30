import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { DAY_LABELS, getWeekDays, isSameDay } from './date-utils'
import type { CalendarEvent, PlanningMode } from './types'

interface WeekGridProps {
  events: CalendarEvent[]
  mode: PlanningMode
  daysCount: 5 | 7
}

const HOUR_HEIGHT = 40 // px
const GUTTER = '2.5rem'

// Lecture seule pour l'instant : grille de la semaine courante, events
// positionnés proportionnellement à leur horaire — pas encore de création
// ni de déplacement (cf. suite à venir).
//
// En-tête et grille dans UN SEUL conteneur scrollable (en-tête `sticky`)
// plutôt que deux grids séparées : sinon la scrollbar du corps (qui prend de
// la largeur) désaligne les colonnes par rapport à l'en-tête, qui lui n'en a
// pas — un seul grid = une seule source de vérité pour la largeur des
// colonnes, plus de désalignement possible.
export function WeekGrid({ events, mode, daysCount }: WeekGridProps) {
  // "compact" = heures de bureau condensées, "extended" = journée complète.
  const startHour = mode === 'compact' ? 8 : 0
  const endHour = mode === 'compact' ? 19 : 24
  const hours = useMemo(() => Array.from({ length: endHour - startHour }, (_, i) => startHour + i), [startHour, endHour])

  const today = useMemo(() => new Date(), [])
  const days = useMemo(() => getWeekDays(today).slice(0, daysCount), [today, daysCount])

  const eventsByDay = useMemo(
    () => days.map((day) => events.filter((e) => !e.allDay && isSameDay(new Date(e.start), day))),
    [events, days],
  )

  const columns = `${GUTTER} repeat(${daysCount}, 1fr)`

  return (
    <div className="nowheel max-h-96 overflow-y-auto text-xs">
      <div className="grid" style={{ gridTemplateColumns: columns }}>
        <div className="sticky top-0 z-10 border-b bg-card" />
        {days.map((day, i) => (
          <div
            key={i}
            className={cn(
              'sticky top-0 z-10 border-b border-l bg-card px-1 py-1 text-center',
              isSameDay(day, today) && 'bg-primary/10 font-semibold',
            )}
          >
            <div className="text-muted-foreground">{DAY_LABELS[i]}</div>
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
        {days.map((day, dayIndex) => (
          <div
            key={dayIndex}
            className={cn('relative border-l', isSameDay(day, today) && 'bg-primary/5')}
            style={{ height: hours.length * HOUR_HEIGHT }}
          >
            {hours.map((h) => (
              <div key={h} className="border-b" style={{ height: HOUR_HEIGHT }} />
            ))}
            {eventsByDay[dayIndex].map((event) => {
              const start = new Date(event.start)
              const end = new Date(event.end)
              const startOffset = start.getHours() + start.getMinutes() / 60 - startHour
              const durationHours = (end.getTime() - start.getTime()) / 3_600_000
              return (
                <div
                  key={event.id}
                  className="absolute inset-x-0.5 overflow-hidden rounded-sm bg-green-200 px-1 py-0.5 text-[10px] text-green-900"
                  style={{
                    top: startOffset * HOUR_HEIGHT,
                    height: Math.max(durationHours * HOUR_HEIGHT, 16),
                    backgroundColor: event.color,
                  }}
                >
                  {event.title}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
