import '@/i18n'
import i18n from '@/i18n'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db'
import { AppProviders } from '@/test/providers'
import { PostItNote } from './PostItNote'

async function seedPostIt(overrides: Partial<Parameters<typeof db.postIts.add>[0]> = {}) {
  await db.postIts.add({
    id: 'post-it-1',
    html: '<p>Contenu existant</p>',
    important: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    x: 0,
    y: 0,
    ...overrides,
  })
}

function renderPostItNote() {
  return render(
    <AppProviders>
      <PostItNote postItId="post-it-1" />
    </AppProviders>,
  )
}

describe('PostItNote', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing while the post-it has not loaded yet', () => {
    const { container } = renderPostItNote()
    expect(container).toBeEmptyDOMElement()
  })

  it('activates on click, showing the floating toolbar', async () => {
    await seedPostIt()
    renderPostItNote()

    const card = await screen.findByText('Contenu existant')
    await userEvent.click(card)

    expect(await screen.findByRole('button', { name: 'Supprimer le post-it' })).toBeInTheDocument()
  })

  it('toggles the important flag', async () => {
    await seedPostIt({ important: false })
    renderPostItNote()

    await userEvent.click(await screen.findByText('Contenu existant'))
    await userEvent.click(await screen.findByRole('button', { name: 'Marquer important' }))

    const stored = await db.postIts.get('post-it-1')
    expect(stored?.important).toBe(true)
  })

  it('deletes the post-it after confirmation', async () => {
    await seedPostIt()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPostItNote()

    await userEvent.click(await screen.findByText('Contenu existant'))
    await userEvent.click(await screen.findByRole('button', { name: 'Supprimer le post-it' }))

    expect(await db.postIts.get('post-it-1')).toBeUndefined()
  })
})
