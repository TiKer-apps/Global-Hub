import { test, expect } from '@playwright/test'

// Layout mobile (MobileHub.tsx, cf. App.tsx useIsMobile) : liste empilée
// sous le breakpoint 768px, à la place du canvas React Flow de HubCanvas.
test.use({ viewport: { width: 390, height: 844 } }) // gabarit iPhone standard

test('renders the stacked mobile layout with all widgets, no console errors', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('/')

  const titles = ['Important', 'Notes', 'Tâches', 'Post-it', 'Todo-list']
  for (const title of titles) {
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: title })).toBeVisible()
  }

  // Pas de canvas React Flow monté en mobile (cf. MobileHub.tsx).
  await expect(page.locator('.react-flow__pane')).toHaveCount(0)

  expect(consoleErrors).toEqual([])
})

test('creates an event via the "Nouvel événement" button (not the drag gesture)', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Nouvel événement' }).click()

  const title = `Réunion mobile ${Date.now()}`
  await page.getByPlaceholder('Titre').fill(title)
  await page.getByRole('button', { name: 'Créer', exact: true }).click()

  await expect(page.getByText(title)).toBeVisible()
})
