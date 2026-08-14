import { within } from '@testing-library/react'
import type userEvent from '@testing-library/user-event'

// Page Object Model pour TaskList : regroupe les locators et les actions
// utilisateur dans une classe dédiée, plutôt que de les répéter dans chaque
// test — un seul endroit à mettre à jour si le markup du composant change.
// Gabarit pour les futurs `.pom.ts` de ce projet (cf. PROJECT.md, "À
// affiner" -> Tests unitaires).
export class TaskListPage {
  private readonly container: HTMLElement
  private readonly user: ReturnType<typeof userEvent.setup>

  // Pas de propriétés de paramètre (`private readonly container: ...` dans
  // la signature du constructeur) : `erasableSyntaxOnly` (tsconfig.app.json)
  // interdit ce sucre syntaxique TS, qui génère du code au runtime
  // (assignation implicite) plutôt que d'être purement effaçable à la
  // compilation.
  constructor(container: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
    this.container = container
    this.user = user
  }

  // Seul élément rendu quand `tasks` est vide (cf. TaskList.tsx) — pas de
  // rôle/texte stable à cibler par ailleurs, un simple sélecteur suffit ici.
  get emptyMessage() {
    return this.container.querySelector('p')
  }

  taskButton(title: string) {
    return within(this.container).getByRole('button', { name: title })
  }

  // Le bouton "!" est le second bouton du même <li> que le titre — pas de
  // libellé stable indépendant du titre pour le cibler directement (son
  // `aria-label` ne dit que "Marquer/Retirer important", identique pour
  // toutes les lignes).
  importantToggle(title: string) {
    const row = this.taskButton(title).closest('li')
    if (!row) throw new Error(`No <li> found for task "${title}"`)
    return within(row).getByRole('button', { name: /important/i })
  }

  isImportant(title: string) {
    return this.importantToggle(title).getAttribute('aria-pressed') === 'true'
  }

  async selectTask(title: string) {
    await this.user.click(this.taskButton(title))
  }

  async toggleImportant(title: string) {
    await this.user.click(this.importantToggle(title))
  }
}
