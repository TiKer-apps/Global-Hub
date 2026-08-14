import '@/i18n'
import i18n from '@/i18n'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db'
import { AppProviders } from '@/test/providers'
import { TasksWidget } from './TasksWidget'
import { TasksWidgetPage } from './TasksWidget.pom'

function renderTasks() {
  const { container } = render(
    <AppProviders>
      <TasksWidget />
    </AppProviders>,
  )
  return new TasksWidgetPage(container, userEvent.setup())
}

describe('TasksWidget', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the empty-list placeholder when there are no tasks', async () => {
    renderTasks()
    expect(await screen.findByText("Aucune tâche pour l'instant — clique sur « + » pour en créer une.")).toBeInTheDocument()
  })

  it('the save button is disabled until a draft has content', async () => {
    const page = renderTasks()
    await page.openNewTask()

    expect(page.saveButton).toBeDisabled()

    await page.typeTitle('Réviser le budget')

    expect(page.saveButton).not.toBeDisabled()
  })

  it('saving a new draft persists it and lists it back', async () => {
    const page = renderTasks()
    await page.openNewTask()
    await page.typeTitle('Préparer la démo')
    await page.save()

    const stored = await db.tasks.toArray()
    expect(stored).toHaveLength(1)
    expect(stored[0].title).toBe('Préparer la démo')
  })

  it('opens an existing task in the editor with its title prefilled', async () => {
    await db.tasks.add({
      id: 'task-1',
      title: 'Tâche existante',
      content: '- premier point',
      important: false,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    })

    const page = renderTasks()
    await page.selectTask('Tâche existante')

    expect((await page.findTitleInput()).value).toBe('Tâche existante')
    expect(page.deleteButton).toBeInTheDocument()
  })

  it('deletes the currently open task after confirmation', async () => {
    await db.tasks.add({
      id: 'task-1',
      title: 'À supprimer',
      content: '',
      important: false,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const page = renderTasks()
    await page.selectTask('À supprimer')
    await page.deleteCurrent()

    expect(await db.tasks.toArray()).toHaveLength(0)
  })
})
