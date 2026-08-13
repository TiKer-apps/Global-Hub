import { useEffect, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { db } from '@/lib/db'
import { EVENT_TYPE_PRESETS, getEventTypePreset } from './event-type-presets'
import type { CalendarEvent, TimeRangeSelection } from './types'

interface EventFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selection: TimeRangeSelection | null
  // Présent = édition d'un event existant (préremplissage, submit -> update,
  // bouton Supprimer) ; absent = création (submit -> add), préremplie depuis
  // `selection` le cas échéant.
  event?: CalendarEvent | null
}

function toDateInputValue(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toTimeInputValue(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

const inputClass = 'w-full rounded-md border bg-background px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground'

// Pré-remplie soit depuis un event existant (édition), soit depuis la
// sélection de plage horaire de WeekGrid/MonthGrid (création —
// `selection.endHour` peut valoir 24 : journée entière sélectionnée via
// l'en-tête ou un clic en vue mois — `setHours(24)` fait naturellement
// basculer au jour suivant à 00h plutôt que de produire une heure invalide
// "24:00").
export function EventFormModal({ open, onOpenChange, selection, event }: EventFormModalProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [important, setImportant] = useState(false)
  const [type, setType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!open) return

    if (event) {
      const startDT = new Date(event.start)
      // DTEND exclusif pour une journée entière : la date affichée dans le
      // formulaire doit être celle du dernier jour INCLUS, pas la date de
      // fin brute stockée (qui pointe déjà le lendemain) — cf. `handleSubmit`
      // pour la conversion inverse à la sauvegarde.
      const endDT = event.allDay ? new Date(new Date(event.end).getTime() - 1) : new Date(event.end)

      setTitle(event.title)
      setAllDay(event.allDay)
      setImportant(event.important)
      setType(event.type ?? '')
      setStartDate(toDateInputValue(startDT))
      setStartTime(toTimeInputValue(startDT.getHours()))
      setEndDate(toDateInputValue(endDT))
      setEndTime(toTimeInputValue(endDT.getHours()))
      setLocation(event.location ?? '')
      setDescription(event.description ?? '')
      return
    }

    const base = selection?.day ?? new Date()

    const startDT = new Date(base)
    startDT.setHours(0, 0, 0, 0)
    startDT.setHours(selection?.startHour ?? 9)

    const endDT = new Date(base)
    endDT.setHours(0, 0, 0, 0)
    endDT.setHours(selection?.endHour ?? 10)

    setTitle('')
    setAllDay(selection?.allDay ?? false)
    setImportant(false)
    setType('')
    setStartDate(toDateInputValue(startDT))
    setStartTime(toTimeInputValue(startDT.getHours()))
    setEndDate(toDateInputValue(endDT))
    setEndTime(toTimeInputValue(endDT.getHours()))
    setLocation('')
    setDescription('')
  }, [open, selection, event])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const start = allDay ? new Date(`${startDate}T00:00:00`) : new Date(`${startDate}T${startTime}:00`)
    const end = allDay ? new Date(`${endDate}T00:00:00`) : new Date(`${endDate}T${endTime}:00`)
    // DTEND exclusif pour une journée entière (même convention que l'import
    // .ics) : la date de fin choisie doit rester incluse dans l'événement.
    if (allDay) end.setDate(end.getDate() + 1)

    // `color` dérive du type choisi — sauf "Aucun type" (`type` vide), où on
    // garde la couleur existante de l'event telle quelle plutôt que de
    // l'écraser à `undefined` (utile si elle a été réglée autrement qu'un
    // type, ex. une future intégration d'import qui la fixerait elle-même).
    const preset = getEventTypePreset(type || undefined)
    const color = preset?.color ?? event?.color

    const patch = {
      title: title.trim(),
      start: start.toISOString(),
      end: end.toISOString(),
      allDay,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      important,
      type: type || undefined,
      color,
    }

    if (event) {
      await db.events.update(event.id, patch)
    } else {
      await db.events.add({ id: crypto.randomUUID(), source: 'local', ...patch })
    }
    onOpenChange(false)
  }

  const handleDelete = async () => {
    if (!event) return
    if (!confirm(t('planning.event.confirmDelete', { title: event.title }))) return
    await db.events.delete(event.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(event ? 'planning.form.titleEdit' : 'planning.form.titleCreate')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('planning.form.titlePlaceholder')}
            required
            className={inputClass}
          />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            {t('planning.form.allDay')}
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} />
            {t('planning.form.important')}
          </label>

          <select value={type} onChange={(e) => setType(e.target.value)} aria-label={t('planning.form.typeLabel')} className={inputClass}>
            <option value="">{t('planning.type.none')}</option>
            {EVENT_TYPE_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {t(preset.labelKey)}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className={inputClass}
            />
            {!allDay && (
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className={cn('w-28', inputClass)}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className={inputClass}
            />
            {!allDay && (
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className={cn('w-28', inputClass)}
              />
            )}
          </div>

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('planning.form.locationPlaceholder')}
            className={inputClass}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('planning.form.descriptionPlaceholder')}
            rows={3}
            className={cn('resize-none', inputClass)}
          />

          <DialogFooter>
            {event && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                className="mr-auto"
                aria-label={t('planning.event.delete')}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('planning.form.cancel')}
            </Button>
            <Button type="submit">{t(event ? 'planning.form.save' : 'planning.form.create')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
