import { test, expect } from '@playwright/test'

// Layout mobile (MobileHub.tsx, cf. App.tsx useIsMobile) : liste empilée
// sous le breakpoint 768px, à la place du canvas React Flow de HubCanvas.
test.use({ viewport: { width: 390, height: 844 } }) // gabarit iPhone standard

test('renders the stacked mobile layout with only Planning visible by default, no console errors', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('/')

  // Seul Planning est visible par défaut (première visite, aucune
  // préférence enregistrée) — les autres widgets noyaient l'écran, cf.
  // module-visibility.ts. Les autres restent accessibles via le drawer.
  await expect(page.locator('[data-slot="card-title"]').filter({ hasText: 'Planning' })).toBeVisible()
  for (const title of ['Important', 'Notes', 'Tâches', 'Post-it', 'Todo-list']) {
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: title })).toHaveCount(0)
  }

  // Pas de canvas React Flow monté en mobile (cf. MobileHub.tsx).
  await expect(page.locator('.react-flow__pane')).toHaveCount(0)

  expect(consoleErrors).toEqual([])
})

test('reveals a hidden module via the drawer', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-slot="card-title"]').filter({ hasText: 'Notes' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Ouvrir le menu des modules' }).click()
  await page.getByRole('button', { name: 'Notes' }).click()

  await expect(page.locator('[data-slot="card-title"]').filter({ hasText: 'Notes' })).toBeVisible()
})

test('creates an event via the "Nouvel événement" button (not the drag gesture)', async ({ page }) => {
  await page.goto('/')

  // En mobile, la toolbar de Planning est un menu radial (PlanningActionsMenu)
  // — "Nouvel événement" n'est visible qu'une fois ce menu ouvert.
  await page.getByRole('button', { name: "Plus d'actions" }).click()
  await page.getByRole('button', { name: 'Nouvel événement' }).click()

  const title = `Réunion mobile ${Date.now()}`
  await page.getByPlaceholder('Titre').fill(title)
  await page.getByRole('button', { name: 'Créer', exact: true }).click()

  await expect(page.getByText(title)).toBeVisible()
})
