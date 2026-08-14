import '@/i18n'
import i18n from '@/i18n'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/test/providers'
import type { PostIt } from '@/modules/post-its/types'
import type { TodoSheet } from '@/modules/todo-list/types'
import { ModuleDrawer } from './ModuleDrawer'

function renderDrawer(overrides: Partial<Parameters<typeof ModuleDrawer>[0]> = {}) {
  const onToggleModule = vi.fn()
  render(
    <AppProviders>
      <ModuleDrawer
        hiddenModuleIds={new Set()}
        onToggleModule={onToggleModule}
        postIts={[]}
        todoSheets={[]}
        {...overrides}
      />
    </AppProviders>,
  )
  return { onToggleModule, user: userEvent.setup() }
}

function samplePostIt(overrides: Partial<PostIt> = {}): PostIt {
  return { id: 'post-it-1', html: '<p>Un mot doux</p>', important: false, createdAt: '2026-08-01T00:00:00.000Z', x: 0, y: 0, ...overrides }
}

function sampleTodoSheet(overrides: Partial<TodoSheet> = {}): TodoSheet {
  return {
    id: 'sheet-1',
    lines: [{ id: 'l1', text: 'Acheter du lait', isItem: true, done: false }],
    important: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    x: 0,
    y: 0,
    ...overrides,
  }
}

describe('ModuleDrawer', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr')
  })

  it('opens the panel and lists every module', async () => {
    const { user } = renderDrawer()
    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu des modules' }))

    expect(screen.getByText('Modules')).toBeInTheDocument()
    for (const label of ['Important', 'Planning', 'Notes', 'Tâches', 'Post-it', 'Todo-list']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('closes the panel via the close button', async () => {
    const { user } = renderDrawer()
    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu des modules' }))
    await user.click(screen.getByRole('button', { name: 'Fermer le menu' }))

    // Le panneau reste monté (transition CSS) mais visuellement hors écran.
    expect(screen.getByText('Modules').closest('div.fixed')).toHaveClass('-translate-x-full')
  })

  it('toggles a module on click', async () => {
    const { user, onToggleModule } = renderDrawer()
    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu des modules' }))
    await user.click(screen.getByText('Notes'))

    expect(onToggleModule).toHaveBeenCalledExactlyOnceWith('notes-1')
  })

  it('shows a preview for each detached post-it and toggles it independently', async () => {
    const { user, onToggleModule } = renderDrawer({ postIts: [samplePostIt()] })
    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu des modules' }))

    const instance = screen.getByRole('button', { name: 'Un mot doux' })
    await user.click(instance)

    expect(onToggleModule).toHaveBeenCalledExactlyOnceWith('post-it-1')
  })

  it('falls back to a placeholder for an empty detached post-it', async () => {
    const { user } = renderDrawer({ postIts: [samplePostIt({ html: '' })] })
    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu des modules' }))

    expect(screen.getByRole('button', { name: 'Vide' })).toBeInTheDocument()
  })

  it('shows the first line of a detached todo sheet as its preview', async () => {
    const { user } = renderDrawer({ todoSheets: [sampleTodoSheet()] })
    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu des modules' }))

    expect(screen.getByRole('button', { name: 'Acheter du lait' })).toBeInTheDocument()
  })

  it('switches the app language, updating already-translated labels', async () => {
    const { user } = renderDrawer()
    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu des modules' }))
    await user.click(screen.getByRole('button', { name: 'English' }))

    expect(screen.getByRole('button', { name: 'Open the modules menu' })).toBeInTheDocument()
  })

  it('opens the settings modal', async () => {
    const { user } = renderDrawer()
    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu des modules' }))
    await user.click(screen.getByRole('button', { name: 'Réglages des modules' }))

    expect(await screen.findByRole('heading', { name: 'Réglages des modules' })).toBeInTheDocument()
  })
})
