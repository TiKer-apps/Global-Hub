import { within } from '@testing-library/react'
import type userEvent from '@testing-library/user-event'

// Même structure que NotesWidget.pom.ts (widget jumeau) — voir ce fichier
// pour le rationale du pattern.
export class TasksWidgetPage {
  private readonly container: HTMLElement
  private readonly user: ReturnType<typeof userEvent.setup>

  constructor(container: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
    this.container = container
    this.user = user
  }

  get scope() {
    return within(this.container)
  }

  findTaskButton(title: string) {
    return this.scope.findByRole('button', { name: title })
  }

  get newTaskButton() {
    return this.scope.getByRole('button', { name: 'Nouvelle tâche' })
  }

  get backToListButton() {
    return this.scope.getByRole('button', { name: 'Retour à la liste' })
  }

  get saveButton() {
    return this.scope.getByRole('button', { name: 'Enregistrer la tâche' })
  }

  get deleteButton() {
    return this.scope.getByRole('button', { name: 'Supprimer la tâche' })
  }

  get titleInput() {
    return this.scope.getByPlaceholderText('Titre') as HTMLInputElement
  }

  findTitleInput() {
    return this.scope.findByPlaceholderText('Titre') as Promise<HTMLInputElement>
  }

  async openNewTask() {
    await this.user.click(this.newTaskButton)
  }

  async selectTask(title: string) {
    await this.user.click(await this.findTaskButton(title))
  }

  async typeTitle(text: string) {
    await this.user.clear(this.titleInput)
    await this.user.type(this.titleInput, text)
  }

  async save() {
    await this.user.click(this.saveButton)
  }

  async deleteCurrent() {
    await this.user.click(this.deleteButton)
  }
}
