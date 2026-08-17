import { test, expect } from '@playwright/test'

// Seul test qui rend réellement App.tsx/HubCanvas.tsx (les tests Vitest
// `component` montent chaque widget en isolation — rendre l'arbre complet
// y bloque indéfiniment, cf. PROJECT.md). Un vrai navigateur contre l'app
// servie contourne ce blocage au lieu de le déboguer.
test('renders all six widgets on the board', async ({ page }) => {
  await page.goto('/')

  const titles = ['Important', 'Planning', 'Notes', 'Tâches', 'Post-it', 'Todo-list']
  for (const title of titles) {
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: title })).toBeVisible()
  }
})
