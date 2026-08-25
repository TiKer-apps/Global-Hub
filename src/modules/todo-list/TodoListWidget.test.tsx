import '@/i18n'
import i18n from '@/i18n'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { AppProviders } from '@/test/providers'
import { TodoListWidget } from './TodoListWidget'

function renderTodoList() {
  render(
    <AppProviders>
      <TodoListWidget />
    </AppProviders>,
  )
  return { input: screen.getByLabelText('Ajouter un élément…'), user: userEvent.setup() }
}

describe('TodoListWidget', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr')
  })

  it('disables "Détacher" while the draft is empty', () => {
    renderTodoList()
    expect(screen.getByRole('button', { name: 'Détacher la fiche' })).toBeDisabled()
  })

  it('adds an item to the draft on Enter, shown as a checkable line', async () => {
    const { input, user } = renderTodoList()

    await user.type(input, 'Acheter du pain{Enter}')

    expect(screen.getByText('Acheter du pain')).toBeVisible()
    expect(screen.getByRole('checkbox', { name: 'Acheter du pain' })).not.toBeChecked()
    expect(input).toHaveValue('')
  })

  it('toggles an item by clicking anywhere on its row, not just the checkbox', async () => {
    const { input, user } = renderTodoList()

    await user.type(input, 'Acheter du pain{Enter}')
    await user.click(screen.getByText('Acheter du pain'))

    expect(screen.getByRole('checkbox', { name: 'Acheter du pain' })).toBeChecked()
  })

  it('removes a draft line without persisting it', async () => {
    const { input, user } = renderTodoList()

    await user.type(input, 'Ligne à retirer{Enter}')
    await user.click(screen.getByRole('button', { name: 'Retirer « Ligne à retirer »' }))

    expect(screen.queryByText('Ligne à retirer')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Détacher la fiche' })).toBeDisabled()
  })

  it('persists the draft lines as a sheet and resets on detach', async () => {
    const { input, user } = renderTodoList()

    await user.type(input, 'Acheter du pain{Enter}')
    await user.type(input, 'Appeler le médecin{Enter}')
    await user.click(screen.getByRole('checkbox', { name: 'Appeler le médecin' }))

    await user.click(screen.getByRole('button', { name: 'Détacher la fiche' }))

    const sheets = await db.todoSheets.toArray()
    expect(sheets).toHaveLength(1)
    expect(sheets[0].lines).toEqual([
      expect.objectContaining({ text: 'Acheter du pain', isItem: true, done: false }),
      expect.objectContaining({ text: 'Appeler le médecin', isItem: true, done: true }),
    ])
    expect(screen.getByRole('button', { name: 'Détacher la fiche' })).toBeDisabled()
  })
})
