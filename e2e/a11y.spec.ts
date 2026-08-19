import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Régression pour les 7 constats corrigés le 2026-08-19 (cf. PROJECT.md,
// jalon "corrections accessibilité") — un vrai navigateur + axe-core sur
// les principales surfaces de l'app, pas une simple lecture du code.
test('desktop board has no automated accessibility violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('event creation modal has no automated accessibility violations', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Nouvel événement' }).click()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('module settings modal has no automated accessibility violations', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Ouvrir le menu des modules' }).click()
  await page.getByRole('button', { name: 'Réglages des modules' }).click()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('focus returns to the trigger button after closing a dialog with Escape', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Nouvel événement' })
  await trigger.click()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
})

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })
  test('mobile board has no automated accessibility violations', async ({ page }) => {
    await page.goto('/')
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
})
