import { within } from '@testing-library/react'
import type userEvent from '@testing-library/user-event'

export class NotesWidgetPage {
  private readonly container: HTMLElement
  private readonly user: ReturnType<typeof userEvent.setup>

  constructor(container: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
    this.container = container
    this.user = user
  }

  get scope() {
    return within(this.container)
  }

  noteButton(title: string) {
    return this.scope.getByRole('button', { name: title })
  }

  // `useLiveQuery` résout de façon asynchrone (même avec fake-indexeddb) —
  // attendre l'apparition plutôt qu'un `getByRole` synchrone évite une race
  // avec le premier rendu (liste encore vide) quand un test insère des
  // données juste avant de monter le widget.
  findNoteButton(title: string) {
    return this.scope.findByRole('button', { name: title })
  }

  get newNoteButton() {
    return this.scope.getByRole('button', { name: 'Nouvelle note' })
  }

  get backToListButton() {
    return this.scope.getByRole('button', { name: 'Retour à la liste' })
  }

  get saveButton() {
    return this.scope.getByRole('button', { name: 'Enregistrer la note' })
  }

  get deleteButton() {
    return this.scope.getByRole('button', { name: 'Supprimer la note' })
  }

  get titleInput() {
    return this.scope.getByPlaceholderText('Titre') as HTMLInputElement
  }

  // Après avoir sélectionné une note existante, l'éditeur affiche
  // "Chargement…" tant que `useLiveQuery` n'a pas résolu CETTE note
  // précise — attendre le champ plutôt que de le lire immédiatement.
  findTitleInput() {
    return this.scope.findByPlaceholderText('Titre') as Promise<HTMLInputElement>
  }

  async openNewNote() {
    await this.user.click(this.newNoteButton)
  }

  async selectNote(title: string) {
    await this.user.click(await this.findNoteButton(title))
  }

  async typeTitle(text: string) {
    await this.user.clear(this.titleInput)
    await this.user.type(this.titleInput, text)
  }

  async save() {
    await this.user.click(this.saveButton)
  }

  async goBackToList() {
    await this.user.click(this.backToListButton)
  }

  async deleteCurrent() {
    await this.user.click(this.deleteButton)
  }
}
