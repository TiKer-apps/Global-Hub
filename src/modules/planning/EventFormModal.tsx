import { useEffect, useState, type FormEvent } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { db } from '@/lib/db'
import type { TimeRangeSelection } from './types'

interface EventFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selection: TimeRangeSelection | null
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

// Pré-remplie depuis la sélection de plage horaire de WeekGrid quand elle
// existe (`selection.endHour` peut valoir 24 — journée entière sélectionnée
// via l'en-tête — `setHours(24)` fait naturellement basculer au jour
// suivant à 00h plutôt que de produire une heure invalide "24:00").
export function EventFormModal({ open, onOpenChange, selection }: EventFormModalProps) {
  const [title, setTitle] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!open) return
    const base = selection?.day ?? new Date()

    const startDT = new Date(base)
    startDT.setHours(0, 0, 0, 0)
    startDT.setHours(selection?.startHour ?? 9)

    const endDT = new Date(base)
    endDT.setHours(0, 0, 0, 0)
    endDT.setHours(selection?.endHour ?? 10)

    setTitle('')
    setAllDay(selection?.allDay ?? false)
    setStartDate(toDateInputValue(startDT))
    setStartTime(toTimeInputValue(startDT.getHours()))
    setEndDate(toDateInputValue(endDT))
    setEndTime(toTimeInputValue(endDT.getHours()))
    setLocation('')
    setDescription('')
  }, [open, selection])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const start = allDay ? new Date(`${startDate}T00:00:00`) : new Date(`${startDate}T${startTime}:00`)
    const end = allDay ? new Date(`${endDate}T00:00:00`) : new Date(`${endDate}T${endTime}:00`)
    // DTEND exclusif pour une journée entière (même convention que l'import
    // .ics) : la date de fin choisie doit rester incluse dans l'événement.
    if (allDay) end.setDate(end.getDate() + 1)

    await db.events.add({
      id: crypto.randomUUID(),
      title: title.trim(),
      start: start.toISOString(),
      end: end.toISOString(),
      allDay,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      source: 'local',
      important: false,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel événement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre"
            required
            className={inputClass}
          />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            Journée entière
          </label>

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
            placeholder="Lieu (optionnel)"
            className={inputClass}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optionnel)"
            rows={3}
            className={cn('resize-none', inputClass)}
          />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
