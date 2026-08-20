import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Menu radial remplaçant, en mobile, la rangée d'actions de PlanningWidget
// (cf. PROJECT.md, jalon "menu radial Planning") : trop de petits boutons
// pour la largeur d'un header de carte mobile. Roue complète (360°) en
// modale centrée sur fond sombre (Dialog), pas un arc ancré au trigger.
test.use({ viewport: { width: 390, height: 844 } })

test('the center button closes the wheel and returns focus to the trigger', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: "Plus d'actions" })
  await trigger.click()

  await page.getByRole('button', { name: 'Fermer' }).click()

  await expect(page.getByRole('button', { name: 'Vue mois' })).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('opens the radial menu and all actions stay within the viewport', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: "Plus d'actions" })
  await trigger.click()

  for (const name of ['Importer un fichier .ics', 'Nouvel événement', 'Vue jour', 'Vue semaine', 'Vue mois']) {
    const box = await page.getByRole('button', { name }).boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(390)
  }
})

test('selecting an action closes the menu and applies it', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: "Plus d'actions" }).click()
  await page.getByRole('button', { name: 'Vue mois' }).click()

  await expect(page.getByRole('button', { name: 'Vue jour' })).toHaveCount(0)
  await expect(page.locator('[data-slot="card-title"]').filter({ hasText: 'mois' })).toBeVisible()
})

test('focus returns to the trigger after selecting an action or pressing Escape', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: "Plus d'actions" })

  await trigger.click()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()

  await trigger.click()
  await page.getByRole('button', { name: 'Vue mois' }).click()
  await expect(trigger).toBeFocused()
})

test('no automated accessibility violations with the menu open', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: "Plus d'actions" }).click()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
