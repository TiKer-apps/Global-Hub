import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDayLabel } from './date-utils'
import { sourceBorderClass, sourceLabelKey } from './source-style'
import type { CalendarEvent } from './types'

interface DayDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  day: Date | null
  // Déjà filtrés/triés par l'appelant (PlanningWidget) — ce composant se
  // contente d'afficher.
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onCreateEvent: () => void
}

function formatHour(d: Date) {
  return d.getMinutes() === 0
    ? `${String(d.getHours()).padStart(2, '0')}h`
    : `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
}

// Ouvert depuis un clic sur une case de la vue mois qui a déjà au moins un
// event (cf. PlanningWidget.handleMonthDayClick) — une case vide continue
// d'ouvrir directement la création, ce composant ne sert que pour voir la
// liste complète d'un jour chargé (au-delà des `MAX_TITLES` premiers titres
// affichés dans MonthGrid).
export function DayDetailModal({ open, onOpenChange, day, events, onEventClick, onCreateEvent }: DayDetailModalProps) {
  const { t, i18n } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('common.close')}>
        <DialogHeader>
          <DialogTitle className="capitalize">{day ? formatDayLabel(day, i18n.language) : ''}</DialogTitle>
        </DialogHeader>
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onEventClick(event)}
              title={t('planning.event.view', { source: t(sourceLabelKey(event.source)) })}
              className={cn(
                'block w-full truncate rounded-sm border-l-4 bg-green-200 px-2 py-1 text-left text-sm text-green-900 hover:ring-1 hover:ring-primary',
                sourceBorderClass(event.source),
              )}
              style={{ backgroundColor: event.color }}
            >
              <span className="font-medium">{event.title}</span>
              {!event.allDay && (
                <span className="ml-2 text-xs opacity-80">
                  {formatHour(new Date(event.start))} – {formatHour(new Date(event.end))}
                </span>
              )}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('planning.form.cancel')}
          </Button>
          <Button type="button" onClick={onCreateEvent}>
            <Plus className="size-3.5" />
            {t('planning.toolbar.newEvent')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
