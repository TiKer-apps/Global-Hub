import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Thème général clair/sombre (drawer, sous le sélecteur de langue) — le
// scaffold shadcn de ce projet a déjà tous les tokens CSS dark mode
// (index.css, classe `.dark` sur `<html>`) : ce switch les active, pas de
// composant à toucher individuellement pour le "chrome" de l'app.

test('follows the system color-scheme preference by default', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true)
})

test('an explicit choice overrides the system preference and persists after reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')

  await page.getByRole('button', { name: 'Ouvrir le menu des modules' }).click()
  await page.getByRole('button', { name: 'Clair' }).click()
  expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false)

  await page.reload()
  expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false)
})

test('no automated accessibility violations in dark mode', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Ouvrir le menu des modules' }).click()
  await page.getByRole('button', { name: 'Sombre' }).click()
  await page.getByRole('button', { name: 'Fermer le menu' }).click()

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('paper surfaces (post-it, todo sheet) keep readable dark text on their fixed light background in dark mode', async ({
  page,
}) => {
  await page.goto('/')

  // Post-it et fiche todo-list ("papier") sont volontairement en dur
  // (jaune/blanc), pas suivis par le thème — leur texte héritait quand
  // même de `text-foreground`, quasi blanc en dark mode (1.11:1 mesuré
  // par axe avant correctif `.paper-surface`, cf. index.css).
  await page.locator('[contenteditable="true"]').first().click()
  await page.keyboard.type('Contenu post-it')
  await page.getByRole('button', { name: 'Détacher le post-it' }).click()

  const todoEditors = page.locator('[contenteditable="true"]')
  await todoEditors.last().click()
  await page.keyboard.type('- item todo')
  await page.getByRole('button', { name: 'Détacher la fiche' }).click()

  await page.getByRole('button', { name: 'Ouvrir le menu des modules' }).click()
  await page.getByRole('button', { name: 'Sombre' }).click()
  await page.getByRole('button', { name: 'Fermer le menu' }).click()

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
