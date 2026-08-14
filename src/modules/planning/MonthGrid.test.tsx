import '@/i18n'
import i18n from '@/i18n'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MonthGrid } from './MonthGrid'
import { getMonthGridDays } from './date-utils'
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

const referenceDate = new Date(2026, 7, 15)
const days = getMonthGridDays(referenceDate)

describe('MonthGrid', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr')
  })

  it('renders 42 day cells (6 full weeks) plus the 7 weekday headers', () => {
    const { container } = render(
      <MonthGrid events={[]} mode="extended" days={days} referenceDate={referenceDate} onDayClick={vi.fn()} onEventClick={vi.fn()} />,
    )
    // 42 cases + 7 en-têtes de colonnes, toutes générées par le même motif
    // de classes de bordure — compte fiable sans dépendre du texte affiché.
    expect(container.querySelectorAll('.border-l')).toHaveLength(42)
  })

  it('clicking an empty day cell calls onDayClick with that date', async () => {
    const onDayClick = vi.fn()
    render(<MonthGrid events={[]} mode="extended" days={days} referenceDate={referenceDate} onDayClick={onDayClick} onEventClick={vi.fn()} />)

    // Le 15 apparaît une seule fois dans la grille (mois courant).
    await userEvent.click(screen.getByText('15'))

    expect(onDayClick).toHaveBeenCalledExactlyOnceWith(expect.any(Date))
    expect(onDayClick.mock.calls[0][0].getDate()).toBe(15)
  })

  it('extended mode shows the event title inside its day cell, and clicking it opens the event (not the day)', async () => {
    const onDayClick = vi.fn()
    const onEventClick = vi.fn()
    render(
      <MonthGrid
        events={[makeEvent()]}
        mode="extended"
        days={days}
        referenceDate={referenceDate}
        onDayClick={onDayClick}
        onEventClick={onEventClick}
      />,
    )

    await userEvent.click(screen.getByText('Réunion'))

    expect(onEventClick).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: 'event-1' }))
    expect(onDayClick).not.toHaveBeenCalled()
  })

  it('compact mode shows a count badge instead of titles', () => {
    const { container } = render(
      <MonthGrid events={[makeEvent()]} mode="compact" days={days} referenceDate={referenceDate} onDayClick={vi.fn()} onEventClick={vi.fn()} />,
    )
    expect(screen.queryByText('Réunion')).toBeNull()
    // Le badge a une classe dédiée (pilule ronde) — plus fiable que de
    // chercher le texte "1", ambigu avec le numéro du jour "1" du mois.
    const badge = container.querySelector('.rounded-full')
    expect(badge?.textContent).toBe('1')
  })

  it('shows an overflow indicator beyond 3 events in extended mode', () => {
    const events = [
      makeEvent({ id: 'e1', title: 'Un' }),
      makeEvent({ id: 'e2', title: 'Deux' }),
      makeEvent({ id: 'e3', title: 'Trois' }),
      makeEvent({ id: 'e4', title: 'Quatre' }),
    ]
    render(<MonthGrid events={events} mode="extended" days={days} referenceDate={referenceDate} onDayClick={vi.fn()} onEventClick={vi.fn()} />)

    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.queryByText('Quatre')).toBeNull()
  })
})
