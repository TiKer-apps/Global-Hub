import '@/i18n'
import i18n from '@/i18n'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { AppProviders } from '@/test/providers'
import { PostItWidget } from './PostItWidget'

function renderPostIt() {
  const { container } = render(
    <AppProviders>
      <PostItWidget />
    </AppProviders>,
  )
  const editable = container.querySelector('[contenteditable="true"]') as HTMLElement
  return { container, editable, user: userEvent.setup() }
}

describe('PostItWidget', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr')
  })

  it('disables "Détacher" while the draft is empty', () => {
    renderPostIt()
    expect(screen.getByRole('button', { name: 'Détacher le post-it' })).toBeDisabled()
  })

  it('enables "Détacher" once the draft has content, and persists it on click', async () => {
    const { editable, user } = renderPostIt()

    await user.click(editable)
    await user.type(editable, 'Ne pas oublier le pain')

    const detach = screen.getByRole('button', { name: 'Détacher le post-it' })
    expect(detach).not.toBeDisabled()

    await user.click(detach)

    const postIts = await db.postIts.toArray()
    expect(postIts).toHaveLength(1)
    expect(postIts[0].html).toContain('Ne pas oublier le pain')
  })

  it('clears the draft back to empty after detaching', async () => {
    const { editable, user } = renderPostIt()

    await user.click(editable)
    await user.type(editable, 'Un mot')
    await user.click(screen.getByRole('button', { name: 'Détacher le post-it' }))

    expect(screen.getByRole('button', { name: 'Détacher le post-it' })).toBeDisabled()
  })
})
