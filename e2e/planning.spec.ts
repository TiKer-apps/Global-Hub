import { test, expect } from '@playwright/test'

test('creates an event via the modal and sees it in the week grid', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Nouvel événement' }).click()

  const title = `Réunion E2E ${Date.now()}`
  await page.getByPlaceholder('Titre').fill(title)
  await page.getByRole('button', { name: 'Créer', exact: true }).click()

  await expect(page.getByText(title)).toBeVisible()
})
