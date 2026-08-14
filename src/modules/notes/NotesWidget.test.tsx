import '@/i18n'
import i18n from '@/i18n'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db'
import { AppProviders } from '@/test/providers'
import { NotesWidget } from './NotesWidget'
import { NotesWidgetPage } from './NotesWidget.pom'

function renderNotes() {
  const { container } = render(
    <AppProviders>
      <NotesWidget />
    </AppProviders>,
  )
  return new NotesWidgetPage(container, userEvent.setup())
}

describe('NotesWidget', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr')
  })

  it('shows the empty-list placeholder when there are no notes', async () => {
    renderNotes()
    expect(await screen.findByText("Aucune note pour l'instant — clique sur « + » pour en créer une.")).toBeInTheDocument()
  })

  it('the save button is disabled until a draft has content', async () => {
    const page = renderNotes()
    await page.openNewNote()

    expect(page.saveButton).toBeDisabled()

    await page.typeTitle('Idée de titre')

    expect(page.saveButton).not.toBeDisabled()
  })

  it('saving a new draft persists it and lists it back', async () => {
    const page = renderNotes()
    await page.openNewNote()
    await page.typeTitle('Ma première note')
    await page.save()

    const stored = await db.notes.toArray()
    expect(stored).toHaveLength(1)
    expect(stored[0].title).toBe('Ma première note')

    await page.goBackToList()
    expect(await screen.findByRole('button', { name: 'Ma première note' })).toBeInTheDocument()
  })

  it('opens an existing note in the editor with its title prefilled', async () => {
    await db.notes.add({
      id: 'note-1',
      title: 'Note existante',
      html: '<p>Contenu</p>',
      important: false,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    })

    const page = renderNotes()
    await page.selectNote('Note existante')

    expect((await page.findTitleInput()).value).toBe('Note existante')
    // Une note déjà réelle affiche Supprimer, jamais Enregistrer.
    expect(page.deleteButton).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enregistrer la note' })).toBeNull()
  })

  it('deletes the currently open note after confirmation', async () => {
    await db.notes.add({
      id: 'note-1',
      title: 'À supprimer',
      html: '<p></p>',
      important: false,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const page = renderNotes()
    await page.selectNote('À supprimer')
    await page.deleteCurrent()

    expect(await db.notes.toArray()).toHaveLength(0)
    expect(await screen.findByText("Aucune note pour l'instant — clique sur « + » pour en créer une.")).toBeInTheDocument()
  })

  it('does not delete when the confirmation is dismissed', async () => {
    await db.notes.add({
      id: 'note-1',
      title: 'Reste là',
      html: '<p></p>',
      important: false,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    })
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    const page = renderNotes()
    await page.selectNote('Reste là')
    await page.deleteCurrent()

    expect(await db.notes.toArray()).toHaveLength(1)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })
})
