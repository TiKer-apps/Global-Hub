import { test, expect } from '@playwright/test'

test('creates a note and finds it back in the list after saving', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Nouvelle note' }).click()

  const title = `Note E2E ${Date.now()}`
  await page.getByPlaceholder('Titre').fill(title)
  await page.getByRole('button', { name: 'Enregistrer la note' }).click()

  await page.getByRole('button', { name: 'Retour à la liste' }).click()

  await expect(page.getByRole('button', { name: title })).toBeVisible()
})
