import '@/i18n'
import i18n from '@/i18n'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { AppProviders } from '@/test/providers'
import { useModuleNavigation } from '@/canvas/module-navigation'
import { ImportantWidget } from './ImportantWidget'

// Affiche la dernière demande de navigation ("Important" -> widget cible)
// pour pouvoir l'asserter depuis le test, sans dépendre du rendu interne du
// widget cible (Notes/Tâches/Planning), hors périmètre de ce fichier.
function NavigationSpy() {
  const { request } = useModuleNavigation()
  return <div data-testid="nav-spy">{request ? `${request.module}:${request.id}` : 'none'}</div>
}

function renderImportant() {
  return render(
    <AppProviders>
      <ImportantWidget />
      <NavigationSpy />
    </AppProviders>,
  )
}

describe('ImportantWidget', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr')
  })

  it('shows a placeholder when nothing is marked important', async () => {
    renderImportant()
    expect(await screen.findByText('Rien de marqué important pour l\'instant.')).toBeInTheDocument()
  })

  it('lists an important note and requests navigation to it on click', async () => {
    await db.notes.add({
      id: 'note-1',
      title: 'Idée cadeau',
      html: '<p></p>',
      important: true,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    })

    renderImportant()
    const button = await screen.findByRole('button', { name: 'Idée cadeau' })
    await userEvent.click(button)

    expect(screen.getByTestId('nav-spy')).toHaveTextContent('notes:note-1')
  })

  it('lists an important event under its own section', async () => {
    await db.events.add({
      id: 'event-1',
      title: 'Rendez-vous médecin',
      start: '2026-08-20T09:00:00.000Z',
      end: '2026-08-20T10:00:00.000Z',
      allDay: false,
      source: 'local',
      important: true,
    })

    renderImportant()
    expect(await screen.findByText('Événements')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Rendez-vous médecin' })
    await userEvent.click(button)

    expect(screen.getByTestId('nav-spy')).toHaveTextContent('planning:event-1')
  })

  it('falls back to a placeholder title for an important post-it with empty content', async () => {
    await db.postIts.add({
      id: 'post-it-1',
      html: '',
      important: true,
      createdAt: '2026-08-01T00:00:00.000Z',
      x: 0,
      y: 0,
    })

    renderImportant()
    expect(await screen.findByText('Sans titre')).toBeInTheDocument()
  })

  it('does not list items that are not marked important', async () => {
    await db.tasks.add({
      id: 'task-1',
      title: 'Pas importante',
      content: '',
      important: false,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    })

    renderImportant()
    expect(await screen.findByText('Rien de marqué important pour l\'instant.')).toBeInTheDocument()
    expect(screen.queryByText('Pas importante')).toBeNull()
  })
})
