import '@/i18n'
import i18n from '@/i18n'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { MobileHub } from './MobileHub'

describe('MobileHub', () => {
  beforeEach(async () => {
    localStorage.clear()
    await i18n.changeLanguage('fr')
  })

  it('lists every visible module', () => {
    render(<MobileHub />)
    for (const title of ['Important', 'Notes', 'Tâches', 'Post-it', 'Todo-list']) {
      expect(screen.getByText(title, { selector: '[data-slot="card-title"]' })).toBeInTheDocument()
    }
  })

  it('hides a module from the list when toggled off via the drawer', async () => {
    const user = userEvent.setup()
    render(<MobileHub />)
    expect(screen.getByText('Notes', { selector: '[data-slot="card-title"]' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu des modules' }))
    await user.click(screen.getByRole('button', { name: 'Notes' }))

    expect(screen.queryByText('Notes', { selector: '[data-slot="card-title"]' })).toBeNull()
  })

  it('renders a detached post-it as a list item', async () => {
    await db.postIts.add({
      id: 'post-it-detached-1',
      html: '<p>Un mot doux</p>',
      important: false,
      createdAt: '2026-08-01T00:00:00.000Z',
      x: 0,
      y: 0,
    })

    render(<MobileHub />)

    expect(await screen.findByText('Un mot doux')).toBeInTheDocument()
  })
})
