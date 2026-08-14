import { within } from '@testing-library/react'
import type userEvent from '@testing-library/user-event'

// Même structure que TaskList.pom.ts (composants jumeaux) — voir ce fichier
// pour le rationale du pattern POM lui-même.
export class NoteListPage {
  private readonly container: HTMLElement
  private readonly user: ReturnType<typeof userEvent.setup>

  constructor(container: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
    this.container = container
    this.user = user
  }

  get emptyMessage() {
    return this.container.querySelector('p')
  }

  noteButton(title: string) {
    return within(this.container).getByRole('button', { name: title })
  }

  importantToggle(title: string) {
    const row = this.noteButton(title).closest('li')
    if (!row) throw new Error(`No <li> found for note "${title}"`)
    return within(row).getByRole('button', { name: /important/i })
  }

  isImportant(title: string) {
    return this.importantToggle(title).getAttribute('aria-pressed') === 'true'
  }

  async selectNote(title: string) {
    await this.user.click(this.noteButton(title))
  }

  async toggleImportant(title: string) {
    await this.user.click(this.importantToggle(title))
  }
}
