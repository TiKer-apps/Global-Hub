import '@/i18n'
import i18n from '@/i18n'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db'
import { EventFormModal } from './EventFormModal'
import type { CalendarEvent, TimeRangeSelection } from './types'

describe('EventFormModal', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not submit an empty title (native "required" validation)', async () => {
    render(<EventFormModal open onOpenChange={vi.fn()} selection={null} />)

    await userEvent.click(screen.getByRole('button', { name: 'Créer' }))

    expect(await db.events.toArray()).toHaveLength(0)
  })

  it('creates a new local event with the entered title', async () => {
    const onOpenChange = vi.fn()
    render(<EventFormModal open onOpenChange={onOpenChange} selection={null} />)

    await userEvent.type(screen.getByPlaceholderText('Titre'), 'Déjeuner équipe')
    await userEvent.click(screen.getByRole('button', { name: 'Créer' }))

    const events = await db.events.toArray()
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ title: 'Déjeuner équipe', source: 'local', allDay: false })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('prefills from the selection (day + hour range)', () => {
    const selection: TimeRangeSelection = { day: new Date(2026, 7, 20), startHour: 14, endHour: 16 }
    render(<EventFormModal open onOpenChange={vi.fn()} selection={selection} />)

    const [startDate] = screen.getAllByDisplayValue('2026-08-20')
    expect(startDate).toBeInTheDocument()
    expect(screen.getByDisplayValue('14:00')).toBeInTheDocument()
    expect(screen.getByDisplayValue('16:00')).toBeInTheDocument()
  })

  it('hides the time inputs once "Journée entière" is checked, and creates an all-day event', async () => {
    render(<EventFormModal open onOpenChange={vi.fn()} selection={null} />)

    await userEvent.type(screen.getByPlaceholderText('Titre'), 'Congé')
    await userEvent.click(screen.getByLabelText('Journée entière'))
    expect(screen.queryByDisplayValue('09:00')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Créer' }))

    const [created] = await db.events.toArray()
    expect(created.allDay).toBe(true)
  })

  it('selecting a type sets the derived color', async () => {
    render(<EventFormModal open onOpenChange={vi.fn()} selection={null} />)

    await userEvent.type(screen.getByPlaceholderText('Titre'), 'Sport')
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'loisirs')
    await userEvent.click(screen.getByRole('button', { name: 'Créer' }))

    const [created] = await db.events.toArray()
    expect(created.type).toBe('loisirs')
    expect(created.color).toBe('#fdba74')
  })

  it('prefills from an existing event for editing, and shows Enregistrer/Supprimer instead of Créer', async () => {
    const event: CalendarEvent = {
      id: 'event-1',
      title: 'Point équipe',
      start: '2026-08-20T09:00:00.000',
      end: '2026-08-20T10:00:00.000',
      allDay: false,
      source: 'local',
      important: true,
      type: 'travail',
    }
    render(<EventFormModal open onOpenChange={vi.fn()} selection={null} event={event} />)

    expect(screen.getByDisplayValue('Point équipe')).toBeInTheDocument()
    expect(screen.getByLabelText('Marquer important')).toBeChecked()
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Créer' })).toBeNull()
  })

  it('updates an existing event on submit rather than creating a new one', async () => {
    await db.events.add({
      id: 'event-1',
      title: 'Ancien titre',
      start: '2026-08-20T09:00:00.000',
      end: '2026-08-20T10:00:00.000',
      allDay: false,
      source: 'local',
      important: false,
    })
    const event = await db.events.get('event-1')

    render(<EventFormModal open onOpenChange={vi.fn()} selection={null} event={event} />)
    const titleInput = screen.getByDisplayValue('Ancien titre')
    await userEvent.clear(titleInput)
    await userEvent.type(titleInput, 'Nouveau titre')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(await db.events.toArray()).toHaveLength(1)
    expect((await db.events.get('event-1'))?.title).toBe('Nouveau titre')
  })

  it('deletes the event after confirmation', async () => {
    await db.events.add({
      id: 'event-1',
      title: 'À supprimer',
      start: '2026-08-20T09:00:00.000',
      end: '2026-08-20T10:00:00.000',
      allDay: false,
      source: 'local',
      important: false,
    })
    const event = await db.events.get('event-1')
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<EventFormModal open onOpenChange={vi.fn()} selection={null} event={event} />)
    await userEvent.click(screen.getByRole('button', { name: "Supprimer l'événement" }))

    expect(await db.events.toArray()).toHaveLength(0)
  })

  it('renders nothing interactive when closed', () => {
    render(<EventFormModal open={false} onOpenChange={vi.fn()} selection={null} />)
    expect(screen.queryByPlaceholderText('Titre')).toBeNull()
  })
})
