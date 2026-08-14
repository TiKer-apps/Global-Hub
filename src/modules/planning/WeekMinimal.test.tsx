import '@/i18n'
import i18n from '@/i18n'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WeekMinimal } from './WeekMinimal'
import type { CalendarEvent } from './types'

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'event-1',
    title: 'Réunion',
    // Pas de suffixe 'Z' : interprété en heure locale, comme le fait le
    // composant lui-même via `.getHours()` sur ces chaînes.
    start: '2026-08-10T09:00:00.000',
    end: '2026-08-10T10:30:00.000',
    allDay: false,
    source: 'local',
    important: false,
    ...overrides,
  }
}

const days = [new Date(2026, 7, 10)]

describe('WeekMinimal', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr')
  })

  it('shows a dashed placeholder for a day with no events', () => {
    const { container } = render(<WeekMinimal events={[]} days={days} onEventClick={vi.fn()} />)
    expect(container.querySelector('.border-dashed')).not.toBeNull()
  })

  it('renders the event title and time range', () => {
    render(<WeekMinimal events={[makeEvent()]} days={days} onEventClick={vi.fn()} />)
    expect(screen.getByText('Réunion')).toBeInTheDocument()
    // Le libellé horaire est réparti sur plusieurs nœuds texte ("09h", " – ",
    // "10h30") — comparer le textContent du conteneur plutôt qu'un match
    // exact `getByText`, qui ne matche qu'un seul nœud à la fois.
    expect(screen.getByText('Réunion').parentElement?.textContent).toContain('09h – 10h30')
  })

  it('calls onEventClick when an event card is clicked', async () => {
    const onEventClick = vi.fn()
    render(<WeekMinimal events={[makeEvent()]} days={days} onEventClick={onEventClick} />)

    await userEvent.click(screen.getByText('Réunion'))

    expect(onEventClick).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: 'event-1' }))
  })

  it('excludes all-day events', () => {
    render(<WeekMinimal events={[makeEvent({ allDay: true })]} days={days} onEventClick={vi.fn()} />)
    expect(screen.queryByText('Réunion')).toBeNull()
  })
})
