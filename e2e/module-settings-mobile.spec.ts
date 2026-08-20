import { test, expect } from '@playwright/test'

// La modale de réglages (ModuleSettingsModal.tsx) utilisait des `Tabs` qui
// ne wrappent pas sur 6 modules — en mobile étroit, ça faisait défiler
// toute la modale horizontalement (signalé par l'utilisateur). Remplacé
// par un `<select>` en mobile (cf. PROJECT.md).
test.use({ viewport: { width: 390, height: 844 } })

test('module settings modal has no horizontal scroll on mobile', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Ouvrir le menu des modules' }).click()
  await page.getByRole('button', { name: 'Réglages des modules' }).click()

  const content = page.locator('[data-slot="dialog-content"]')
  const scrollWidth = await content.evaluate((el) => el.scrollWidth)
  const clientWidth = await content.evaluate((el) => el.clientWidth)
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
})

test('switching module via the select updates the theme/style pickers', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Ouvrir le menu des modules' }).click()
  await page.getByRole('button', { name: 'Réglages des modules' }).click()

  await page.getByRole('combobox', { name: 'Module' }).selectOption({ label: 'Notes' })
  // Thème par défaut de Notes (module-registry.ts) : "Bleu" doit
  // apparaître sélectionné une fois basculé sur ce module.
  await expect(page.getByRole('button', { name: 'Bleu' })).toHaveAttribute('aria-pressed', 'true')
})
