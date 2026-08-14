import '@/i18n'
import i18n from '@/i18n'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { AppProviders } from '@/test/providers'
import { PlanningWidget } from './PlanningWidget'

function renderPlanning() {
  render(
    <AppProviders>
      <PlanningWidget config={{ view: 'week', mode: 'extended' }} />
    </AppProviders>,
  )
  return userEvent.setup()
}

describe('PlanningWidget', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr')
  })

  it('starts on the view given by config, with the matching toolbar toggles visible', () => {
    renderPlanning()
    expect(screen.getByRole('button', { name: 'Vue semaine' })).toBeInTheDocument()
    // Bascule 5/7 jours : seulement en vue semaine.
    expect(screen.getByRole('button', { name: 'Passer à 5 jours' })).toBeInTheDocument()
  })

  it('switches to day view: hides the 5/7-days toggle', async () => {
    const user = renderPlanning()
    await user.click(screen.getByRole('button', { name: 'Vue jour' }))

    expect(screen.queryByRole('button', { name: 'Passer à 5 jours' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Passer en mode minimaliste' })).toBeInTheDocument()
  })

  it('switches to month view: hides the days-count and grid/minimal toggles', async () => {
    const user = renderPlanning()
    await user.click(screen.getByRole('button', { name: 'Vue mois' }))

    expect(screen.queryByRole('button', { name: 'Passer à 5 jours' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Passer en mode minimaliste' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Afficher un indicateur au lieu des titres' })).toBeInTheDocument()
  })

  it('opens the creation modal from "Nouvel événement"', async () => {
    const user = renderPlanning()
    await user.click(screen.getByRole('button', { name: 'Nouvel événement' }))

    expect(await screen.findByText('Nouvel événement', { selector: 'h2, [role=heading]' })).toBeInTheDocument()
  })

  it('opens the edit modal when clicking an existing event', async () => {
    await db.events.add({
      id: 'event-1',
      title: 'Point équipe',
      // Semaine courante, un jour arbitraire à une heure fixe.
      start: new Date().toISOString(),
      end: new Date(Date.now() + 3600_000).toISOString(),
      allDay: false,
      source: 'local',
      important: false,
    })

    const user = renderPlanning()
    await user.click(await screen.findByText('Point équipe'))

    expect(await screen.findByDisplayValue('Point équipe')).toBeInTheDocument()
  })

  it('imports events from an uploaded .ics file and shows a pluralized status message', async () => {
    const user = renderPlanning()
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:import-1
SUMMARY:Événement importé
DTSTART:20260815T090000
DTEND:20260815T100000
END:VEVENT
END:VCALENDAR`
    const file = new File([ics], 'test.ics', { type: 'text/calendar' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)

    expect(await screen.findByText('1 événement importé.')).toBeInTheDocument()
    expect(await db.events.toArray()).toHaveLength(1)
  })
})
