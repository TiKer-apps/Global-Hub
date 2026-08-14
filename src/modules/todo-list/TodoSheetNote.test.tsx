import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { db } from '@/lib/db'
import { TodoSheetNote } from './TodoSheetNote'

async function seedSheet() {
  await db.todoSheets.add({
    id: 'sheet-1',
    lines: [
      { id: 'line-1', text: 'Item cochable', isItem: true, done: false },
      { id: 'line-2', text: 'Ligne simple', isItem: false, done: false },
    ],
    important: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    x: 0,
    y: 0,
  })
}

describe('TodoSheetNote', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing while the sheet has not loaded yet', () => {
    const { container } = render(<TodoSheetNote sheetId="does-not-exist" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders every line of the sheet', async () => {
    await seedSheet()
    render(<TodoSheetNote sheetId="sheet-1" />)

    expect(await screen.findByText('Item cochable')).toBeInTheDocument()
    expect(screen.getByText('Ligne simple')).toBeInTheDocument()
  })

  it('clicking a checkable item strikes it through (toggles done)', async () => {
    await seedSheet()
    render(<TodoSheetNote sheetId="sheet-1" />)

    await userEvent.click(await screen.findByText('Item cochable'))

    const stored = await db.todoSheets.get('sheet-1')
    expect(stored?.lines.find((l) => l.id === 'line-1')?.done).toBe(true)
  })

  it('clicking a plain line greys it out and appends a checkmark', async () => {
    await seedSheet()
    render(<TodoSheetNote sheetId="sheet-1" />)

    await userEvent.click(await screen.findByText('Ligne simple'))

    expect(await screen.findByText('Ligne simple ✓')).toBeInTheDocument()
  })

  it('toggles the important flag', async () => {
    await seedSheet()
    render(<TodoSheetNote sheetId="sheet-1" />)

    await userEvent.click(await screen.findByRole('button', { name: 'Marquer important' }))

    expect((await db.todoSheets.get('sheet-1'))?.important).toBe(true)
  })

  it('deletes the sheet after confirmation', async () => {
    await seedSheet()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<TodoSheetNote sheetId="sheet-1" />)

    await userEvent.click(await screen.findByRole('button', { name: 'Supprimer la fiche' }))

    expect(await db.todoSheets.get('sheet-1')).toBeUndefined()
  })
})
