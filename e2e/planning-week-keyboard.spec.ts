import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Sélection d'une plage horaire dans WeekGrid au clavier (flèches pour
// naviguer, Maj+flèche pour étendre, Entrée pour confirmer, Échap pour
// annuler) — cf. PROJECT.md, dette identifiée lors de l'audit accessibilité
// du 2026-08-19 (glisser-souris uniquement, aucun équivalent clavier).
// `.focus()` plutôt que `.click()` sur les cellules : un clic déclenche la
// même logique mousedown/mouseup que le glisser-souris (crée déjà une
// sélection), ce qui fausserait un test censé vérifier le chemin clavier.

test('arrow keys move focus between hour cells without creating a selection', async ({ page }) => {
  await page.goto('/')
  const startCell = page.getByRole('button', { name: /, 8h$/ }).first()
  await startCell.focus()

  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('button', { name: /, 9h$/ }).first()).toBeFocused()

  await page.keyboard.press('ArrowUp')
  await expect(startCell).toBeFocused()

  await expect(page.getByPlaceholder('Titre')).toHaveCount(0)
})

test('shift+arrow extends a range, shown as a highlighted preview', async ({ page }) => {
  await page.goto('/')
  const startCell = page.getByRole('button', { name: /, 8h$/ }).first()
  await startCell.focus()

  const before = await page.locator('.ring-blue-500').count()
  expect(before).toBe(0)

  const cellBox = await startCell.boundingBox()

  await page.keyboard.press('Shift+ArrowDown')
  await page.keyboard.press('Shift+ArrowDown')

  const preview = page.locator('.ring-blue-500')
  await expect(preview).toHaveCount(1)
  const box = await preview.boundingBox()
  // Le canvas React Flow applique son propre zoom (cf. commentaire sur
  // `hourFromEvent` dans WeekGrid.tsx) : la hauteur en pixels réels dépend du
  // zoom courant, donc on compare au ratio d'une cellule plutôt qu'à 3×40px.
  expect(box!.height / cellBox!.height).toBeCloseTo(3, 1)

  // Toujours pas de modale tant qu'on n'a pas confirmé.
  await expect(page.getByPlaceholder('Titre')).toHaveCount(0)
})

test('enter confirms the extended range and opens the prefilled form', async ({ page }) => {
  await page.goto('/')
  const startCell = page.getByRole('button', { name: /, 8h$/ }).first()
  await startCell.focus()

  await page.keyboard.press('Shift+ArrowDown')
  await page.keyboard.press('Shift+ArrowDown')
  await page.keyboard.press('Enter')

  await expect(page.getByPlaceholder('Titre')).toBeVisible()
  await expect(page.getByLabel('Heure de début')).toHaveValue('08:00')
  await expect(page.getByLabel('Heure de fin')).toHaveValue('11:00')
})

test('enter without extending creates a 1-hour selection, matching a plain click', async ({ page }) => {
  await page.goto('/')
  const startCell = page.getByRole('button', { name: /, 8h$/ }).first()
  await startCell.focus()

  await page.keyboard.press('Enter')

  await expect(page.getByPlaceholder('Titre')).toBeVisible()
  await expect(page.getByLabel('Heure de début')).toHaveValue('08:00')
  await expect(page.getByLabel('Heure de fin')).toHaveValue('09:00')
})

test('escape cancels a pending extension without opening the form', async ({ page }) => {
  await page.goto('/')
  const startCell = page.getByRole('button', { name: /, 8h$/ }).first()
  await startCell.focus()

  await page.keyboard.press('Shift+ArrowDown')
  await page.keyboard.press('Escape')

  await expect(page.locator('.ring-blue-500')).toHaveCount(0)
  await expect(page.getByPlaceholder('Titre')).toHaveCount(0)
})

test('no automated accessibility violations on the week grid', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).include('.nowheel').analyze()
  expect(results.violations).toEqual([])
})
