import i18n from '@/i18n'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskList } from './TaskList'
import { TaskListPage } from './TaskList.pom'
import type { Task } from './types'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    title: 'Préparer le point hebdo',
    content: '- envoyer l\'ordre du jour',
    important: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('TaskList', () => {
  beforeEach(async () => {
    // Langue déterministe pour chaque test, indépendamment de l'ordre
    // d'exécution (un autre test pourrait laisser i18next en anglais).
    await i18n.changeLanguage('fr')
  })

  it('shows a placeholder message when there are no tasks', () => {
    const { container } = render(<TaskList tasks={[]} onSelect={vi.fn()} onToggleImportant={vi.fn()} />)
    const page = new TaskListPage(container, userEvent.setup())
    expect(page.emptyMessage?.textContent).toBe("Aucune tâche pour l'instant — clique sur « + » pour en créer une.")
  })

  it('falls back to a placeholder title for an untitled task', () => {
    const { container } = render(
      <TaskList tasks={[makeTask({ title: '' })]} onSelect={vi.fn()} onToggleImportant={vi.fn()} />,
    )
    const page = new TaskListPage(container, userEvent.setup())
    expect(() => page.taskButton('Sans titre')).not.toThrow()
  })

  it('calls onSelect with the task id when its title is clicked', async () => {
    const onSelect = vi.fn()
    const task = makeTask()
    const { container } = render(<TaskList tasks={[task]} onSelect={onSelect} onToggleImportant={vi.fn()} />)
    const user = userEvent.setup()
    const page = new TaskListPage(container, user)

    await page.selectTask(task.title)

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(task.id)
  })

  it('calls onToggleImportant with the flipped value when the star is clicked', async () => {
    const onToggleImportant = vi.fn()
    const task = makeTask({ important: false })
    const { container } = render(
      <TaskList tasks={[task]} onSelect={vi.fn()} onToggleImportant={onToggleImportant} />,
    )
    const user = userEvent.setup()
    const page = new TaskListPage(container, user)

    expect(page.isImportant(task.title)).toBe(false)

    await page.toggleImportant(task.title)

    expect(onToggleImportant).toHaveBeenCalledExactlyOnceWith(task.id, true)
  })
})
