import '@/i18n'
import i18n from '@/i18n'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NoteList } from './NoteList'
import { NoteListPage } from './NoteList.pom'
import type { Note } from './types'

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    title: 'Idées de cadeaux',
    html: '<p>Un livre, peut-être ?</p>',
    important: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('NoteList', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr')
  })

  it('shows a placeholder message when there are no notes', () => {
    const { container } = render(<NoteList notes={[]} onSelect={vi.fn()} onToggleImportant={vi.fn()} />)
    const page = new NoteListPage(container, userEvent.setup())
    expect(page.emptyMessage?.textContent).toBe("Aucune note pour l'instant — clique sur « + » pour en créer une.")
  })

  it('falls back to a placeholder title for an untitled note', () => {
    const { container } = render(
      <NoteList notes={[makeNote({ title: '' })]} onSelect={vi.fn()} onToggleImportant={vi.fn()} />,
    )
    const page = new NoteListPage(container, userEvent.setup())
    expect(() => page.noteButton('Sans titre')).not.toThrow()
  })

  it('calls onSelect with the note id when its title is clicked', async () => {
    const onSelect = vi.fn()
    const note = makeNote()
    const { container } = render(<NoteList notes={[note]} onSelect={onSelect} onToggleImportant={vi.fn()} />)
    const page = new NoteListPage(container, userEvent.setup())

    await page.selectNote(note.title)

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(note.id)
  })

  it('calls onToggleImportant with the flipped value when the star is clicked', async () => {
    const onToggleImportant = vi.fn()
    const note = makeNote({ important: true })
    const { container } = render(
      <NoteList notes={[note]} onSelect={vi.fn()} onToggleImportant={onToggleImportant} />,
    )
    const page = new NoteListPage(container, userEvent.setup())

    expect(page.isImportant(note.title)).toBe(true)

    await page.toggleImportant(note.title)

    expect(onToggleImportant).toHaveBeenCalledExactlyOnceWith(note.id, false)
  })
})
