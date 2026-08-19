import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { eventOccursOnDay, getDayLabel, isSameDay } from './date-utils'
import { sourceBorderClass, sourceLabelKey } from './source-style'
import type { CalendarEvent } from './types'

interface WeekMinimalProps {
  events: CalendarEvent[]
  days: Date[]
  onEventClick: (event: CalendarEvent) => void
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
export function WeekMinimal({ events, days, onEventClick }: WeekMinimalProps) {
  const { t, i18n } = useTranslation()
  // `today` : la vraie date du jour, pour le surlignage — indépendant de la
  // semaine affichée (`days`), qui peut être passée/future après navigation.
  const today = useMemo(() => new Date(), [])

  const timedEventsByDay = useMemo(
    () => days.map((day) => events.filter((e) => !e.allDay && isSameDay(new Date(e.start), day))),
    [events, days],
  )
  const allDayEventsByDay = useMemo(
    () => days.map((day) => events.filter((e) => e.allDay && eventOccursOnDay(e, day))),
    [events, days],
  )

  const columns = `repeat(${days.length}, 1fr)`

  return (
    // `tabIndex={0}` : cf. WeekGrid.tsx, même correctif (audit
    // accessibilité du 2026-08-19).
    <div className="nowheel max-h-96 overflow-y-auto text-xs" tabIndex={0}>
      <div className="grid gap-1" style={{ gridTemplateColumns: columns }}>
        {days.map((day, i) => (
          <div
            key={i}
            className={cn('sticky top-0 z-10 border-b bg-card px-1 py-1 text-center', isSameDay(day, today) && 'bg-primary/10 font-semibold')}
          >
            {/* `text-foreground` sur le jour surligné : cf. WeekGrid.tsx,
                même correctif contraste (audit accessibilité 2026-08-19). */}
            <div className={cn(isSameDay(day, today) ? 'text-foreground' : 'text-muted-foreground')}>
              {getDayLabel(day, i18n.language)}
            </div>
            <div>{day.getDate()}</div>
          </div>
        ))}
        {days.map((_, dayIndex) => (
          <div key={dayIndex} className="flex flex-col gap-1 pt-1">
            {allDayEventsByDay[dayIndex].length === 0 && timedEventsByDay[dayIndex].length === 0 ? (
              <div className="h-10 rounded-sm border border-dashed" />
            ) : (
              <>
                {allDayEventsByDay[dayIndex].map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onEventClick(event)}
                    title={t('planning.event.view', { source: t(sourceLabelKey(event.source)) })}
                    className={cn(
                      'block w-full rounded-sm border-l-4 bg-green-200 px-1 py-1 text-left text-green-900 hover:ring-1 hover:ring-primary',
                      sourceBorderClass(event.source),
                    )}
                    style={{ backgroundColor: event.color }}
                  >
                    <div className="truncate font-medium">{event.title}</div>
                    <div className="text-[10px] opacity-80">{t('planning.form.allDay')}</div>
                  </button>
                ))}
                {timedEventsByDay[dayIndex].map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onEventClick(event)}
                    title={t('planning.event.view', { source: t(sourceLabelKey(event.source)) })}
                    className={cn(
                      'block w-full rounded-sm border-l-4 bg-green-200 px-1 py-1 text-left text-green-900 hover:ring-1 hover:ring-primary',
                      sourceBorderClass(event.source),
                    )}
                    style={{ backgroundColor: event.color }}
                  >
                    <div className="truncate font-medium">{event.title}</div>
                    <div className="text-[10px] opacity-80">
                      {formatHour(new Date(event.start))} – {formatHour(new Date(event.end))}
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
