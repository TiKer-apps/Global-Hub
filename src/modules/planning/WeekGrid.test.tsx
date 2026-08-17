import '@/i18n'
import i18n from '@/i18n'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WeekGrid } from './WeekGrid'
import type { CalendarEvent } from './types'

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'event-1',
    title: 'Réunion',
    start: '2026-08-10T09:00:00.000Z',
    end: '2026-08-10T10:00:00.000Z',
    allDay: false,
    source: 'local',
    important: false,
    ...overrides,
  }
}

const MONDAY = new Date(2026, 7, 10)
const days = [MONDAY]

describe('WeekGrid', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr')
  })

  it('renders an hourly row per hour, 0-24h in extended mode', () => {
    render(<WeekGrid events={[]} mode="extended" days={days} selection={null} onSelectionChange={vi.fn()} onEventClick={vi.fn()} />)
    expect(screen.getByText('00h')).toBeInTheDocument()
    expect(screen.getByText('23h')).toBeInTheDocument()
  })

  it('starts at 8h and ends at 18h in compact mode', () => {
    render(<WeekGrid events={[]} mode="compact" days={days} selection={null} onSelectionChange={vi.fn()} onEventClick={vi.fn()} />)
    expect(screen.getByText('08h')).toBeInTheDocument()
    expect(screen.getByText('18h')).toBeInTheDocument()
    expect(screen.queryByText('19h')).toBeNull()
  })

  it('clicking a day header selects the whole day', async () => {
    const onSelectionChange = vi.fn()
    render(<WeekGrid events={[]} mode="compact" days={days} selection={null} onSelectionChange={onSelectionChange} onEventClick={vi.fn()} />)

    await userEvent.click(screen.getByText('10'))

    expect(onSelectionChange).toHaveBeenCalledWith({ day: MONDAY, startHour: 8, endHour: 19 })
  })

  it('clicking the header again on an already fully-selected day clears the selection', async () => {
    const onSelectionChange = vi.fn()
    render(
      <WeekGrid
        events={[]}
        mode="compact"
        days={days}
        selection={{ day: MONDAY, startHour: 8, endHour: 19 }}
        onSelectionChange={onSelectionChange}
        onEventClick={vi.fn()}
      />,
    )

    await userEvent.click(screen.getByText('10'))

    expect(onSelectionChange).toHaveBeenCalledWith(null)
  })

  it('clicking an event calls onEventClick instead of starting a selection', async () => {
    const onEventClick = vi.fn()
    const onSelectionChange = vi.fn()
    render(
      <WeekGrid
        events={[makeEvent()]}
        mode="extended"
        days={days}
        selection={null}
        onSelectionChange={onSelectionChange}
        onEventClick={onEventClick}
      />,
    )

    await userEvent.click(screen.getByText('Réunion'))

    expect(onEventClick).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: 'event-1' }))
    expect(onSelectionChange).not.toHaveBeenCalled()
  })

  it('renders an all-day event in the dedicated all-day row, not positioned on the hourly grid', () => {
    render(
      <WeekGrid
        events={[makeEvent({ allDay: true })]}
        mode="extended"
        days={days}
        selection={null}
        onSelectionChange={vi.fn()}
        onEventClick={vi.fn()}
      />,
    )
    const chip = screen.getByText('Réunion')
    expect(chip).toBeInTheDocument()
    // Contrairement aux chips horaires, la rangée allDay ne positionne pas
    // ses chips en absolu (pas de `top`/`height` calculés en heures).
    expect(chip.style.top).toBe('')
  })
})
