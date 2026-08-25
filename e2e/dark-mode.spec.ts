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

test('the React Flow controls and minimap follow the toggle instead of staying stuck light', async ({ page }) => {
  // `Controls`/`MiniMap` (@xyflow/react) ont leur propre thème indépendant
  // des variables CSS de l'app — sans le prop `colorMode` (câblé sur
  // `useColorScheme` dans HubCanvas.tsx), ils restaient blancs quel que
  // soit `.dark` sur `<html>`. `useColorScheme` doit aussi rester
  // synchronisé entre ses deux points de montage (ModuleDrawer et
  // HubCanvas), d'où l'assertion via le bouton du drawer plutôt qu'un
  // simple `localStorage.setItem`.
  await page.goto('/')
  const zoomIn = page.locator('.react-flow__controls-zoomin')
  const lightBg = await zoomIn.evaluate((el) => getComputedStyle(el).backgroundColor)

  await page.getByRole('button', { name: 'Ouvrir le menu des modules' }).click()
  await page.getByRole('button', { name: 'Sombre' }).click()
  await page.getByRole('button', { name: 'Fermer le menu' }).click()

  const darkBg = await zoomIn.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(darkBg).not.toBe(lightBg)
})

test('no automated accessibility violations in dark mode', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Ouvrir le menu des modules' }).click()
  await page.getByRole('button', { name: 'Sombre' }).click()
  await page.getByRole('button', { name: 'Fermer le menu' }).click()

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('the post-it paper surface keeps readable dark text on its fixed light background in dark mode', async ({ page }) => {
  await page.goto('/')

  // Post-it ("papier") est volontairement en dur (jaune), pas suivi par le
  // thème — son texte héritait quand même de `text-foreground`, quasi
  // blanc en dark mode (1.11:1 mesuré par axe avant correctif
  // `.paper-surface`, cf. index.css). La todo-list n'a plus de surface
  // papier depuis sa refonte en liste plate (cf. PROJECT.md) — plus
  // concernée par ce cas précis, mais toujours couverte par le scan axe
  // ci-dessous via son contenu.
  await page.locator('[contenteditable="true"]').first().click()
  await page.keyboard.type('Contenu post-it')
  await page.getByRole('button', { name: 'Détacher le post-it' }).click()

  await page.getByLabel('Ajouter un élément…').fill('item todo')
  await page.getByLabel('Ajouter un élément…').press('Enter')
  await page.getByRole('button', { name: 'Détacher la fiche' }).click()

  await page.getByRole('button', { name: 'Ouvrir le menu des modules' }).click()
  await page.getByRole('button', { name: 'Sombre' }).click()
  await page.getByRole('button', { name: 'Fermer le menu' }).click()

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
