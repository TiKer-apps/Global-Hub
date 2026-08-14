import '@/i18n'
import i18n from '@/i18n'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { AppProviders } from '@/test/providers'
import { TodoListWidget } from './TodoListWidget'

function renderTodoList() {
  const { container } = render(
    <AppProviders>
      <TodoListWidget />
    </AppProviders>,
  )
  const editable = container.querySelector('[contenteditable="true"]') as HTMLElement
  return { editable, user: userEvent.setup() }
}

describe('TodoListWidget', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr')
  })

  it('disables "Détacher" while the draft is empty', () => {
    renderTodoList()
    expect(screen.getByRole('button', { name: 'Détacher la fiche' })).toBeDisabled()
  })

  it('splits the draft into checkable/plain lines and persists them as a sheet', async () => {
    const { editable, user } = renderTodoList()

    await user.click(editable)
    await user.type(editable, '- acheter du pain{Enter}Contexte de la course')

    await user.click(screen.getByRole('button', { name: 'Détacher la fiche' }))

    const sheets = await db.todoSheets.toArray()
    expect(sheets).toHaveLength(1)
    expect(sheets[0].lines).toEqual([
      expect.objectContaining({ text: 'acheter du pain', isItem: true, done: false }),
      expect.objectContaining({ text: 'Contexte de la course', isItem: false, done: false }),
    ])
  })

  it('clears the draft back to empty after detaching', async () => {
    const { editable, user } = renderTodoList()

    await user.click(editable)
    await user.type(editable, '- un item')
    await user.click(screen.getByRole('button', { name: 'Détacher la fiche' }))

    expect(screen.getByRole('button', { name: 'Détacher la fiche' })).toBeDisabled()
  })
})
