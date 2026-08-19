import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { eventOccursOnDay, getWeekDayHeaderLabels, isSameDay } from './date-utils'
import { sourceBorderClass, sourceLabelKey } from './source-style'
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

// Pas d'état de drag ici (contrairement à WeekGrid) : un clic sur une case
// produit directement une sélection finale journée entière, il n'y a pas de
// plage horaire à affiner par glisser sur un axe qui n'existe pas.
export function MonthGrid({ events, mode, days, referenceDate, onDayClick, onEventClick }: MonthGridProps) {
  const { t, i18n } = useTranslation()
  const today = useMemo(() => new Date(), [])
  const currentMonth = referenceDate.getMonth()
  const weekDayLabels = useMemo(() => getWeekDayHeaderLabels(i18n.language), [i18n.language])

  const eventsByDay = useMemo(
    () => days.map((day) => events.filter((e) => eventOccursOnDay(e, day))),
    [events, days],
  )

  return (
    // `tabIndex={0}` : cf. WeekGrid.tsx, même correctif (audit
    // accessibilité du 2026-08-19).
    <div className="nowheel max-h-96 overflow-y-auto text-xs" tabIndex={0}>
      <div className="grid grid-cols-7">
        {weekDayLabels.map((label, i) => (
          <div key={i} className="sticky top-0 z-10 border-b bg-card px-1 py-1 text-center text-muted-foreground">
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
              // Cible fiable pour les tests : le libellé (quantième) seul se
              // répète dans la grille (jours des mois adjacents), une date
              // ISO complète non.
              data-date={day.toISOString().slice(0, 10)}
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
                    <button
                      key={event.id}
                      type="button"
                      // La case entière ouvre la création d'un event (clic sur
                      // une zone vide) — sans stopPropagation, cliquer une
                      // chip remonterait aussi ce clic à la case et ouvrirait
                      // la modale de création en plus de celle d'édition.
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
