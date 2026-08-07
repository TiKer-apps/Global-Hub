import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { getDayLabel, isSameDay } from './date-utils'
import type { CalendarEvent } from './types'

interface WeekMinimalProps {
  events: CalendarEvent[]
  days: Date[]
}

function formatHour(d: Date) {
  return d.getMinutes() === 0
    ? `${String(d.getHours()).padStart(2, '0')}h`
    : `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
}

// Mode minimaliste : plus de grille horaire, une case par event (empilées
// s'il y en a plusieurs le même jour) avec juste la plage horaire en texte —
// une case vide en pointillés si rien ce jour-là. Même technique d'en-tête
// `sticky` que WeekGrid pour garder les colonnes alignées au scroll.
export function WeekMinimal({ events, days }: WeekMinimalProps) {
  // `today` : la vraie date du jour, pour le surlignage — indépendant de la
  // semaine affichée (`days`), qui peut être passée/future après navigation.
  const today = useMemo(() => new Date(), [])

  const eventsByDay = useMemo(
    () => days.map((day) => events.filter((e) => !e.allDay && isSameDay(new Date(e.start), day))),
    [events, days],
  )

  const columns = `repeat(${days.length}, 1fr)`

  return (
    <div className="nowheel max-h-96 overflow-y-auto text-xs">
      <div className="grid gap-1" style={{ gridTemplateColumns: columns }}>
        {days.map((day, i) => (
          <div
            key={i}
            className={cn('sticky top-0 z-10 border-b bg-card px-1 py-1 text-center', isSameDay(day, today) && 'bg-primary/10 font-semibold')}
          >
            <div className="text-muted-foreground">{getDayLabel(day)}</div>
            <div>{day.getDate()}</div>
          </div>
        ))}
        {days.map((_, dayIndex) => (
          <div key={dayIndex} className="flex flex-col gap-1 pt-1">
            {eventsByDay[dayIndex].length === 0 ? (
              <div className="h-10 rounded-sm border border-dashed" />
            ) : (
              eventsByDay[dayIndex].map((event) => (
                <div
                  key={event.id}
                  className="rounded-sm bg-green-200 px-1 py-1 text-green-900"
                  style={{ backgroundColor: event.color }}
                >
                  <div className="truncate font-medium">{event.title}</div>
                  <div className="text-[10px] opacity-80">
                    {formatHour(new Date(event.start))} – {formatHour(new Date(event.end))}
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
