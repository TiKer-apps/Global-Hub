import { test, expect, type Page } from '@playwright/test'

// Comparer des positions écran avant/après un `page.reload()` serait fragile
// ici : `fitView` (cf. HubCanvas.tsx) recalcule zoom/pan au montage à partir
// des positions de tous les nodes, donc le viewport après reload peut
// différer de celui d'avant le drag même si la position logique du post-it,
// elle, n'a pas bougé. On vérifie directement la valeur persistée dans
// IndexedDB (table `postIts` de la base `global-hub`, cf. src/lib/db.ts),
// ce qui est aussi ce que ce test cherche à couvrir : le chemin
// React Flow → Dexie → reload, pas le rendu pixel.
function getPostItPosition(page: Page, id: string) {
  return page.evaluate(
    (postItId) =>
      new Promise<{ x: number; y: number } | null>((resolve, reject) => {
        const req = indexedDB.open('global-hub')
        req.onsuccess = () => {
          const tx = req.result.transaction('postIts', 'readonly')
          const getReq = tx.objectStore('postIts').get(postItId)
          getReq.onsuccess = () => resolve(getReq.result ? { x: getReq.result.x, y: getReq.result.y } : null)
          getReq.onerror = () => reject(getReq.error)
        }
        req.onerror = () => reject(req.error)
      }),
    id,
  )
}

test('drags a detached post-it and keeps its position after reload', async ({ page }) => {
  await page.goto('/')

  const text = `Drag E2E ${Date.now()}`
  await page.locator('[contenteditable="true"]').first().click()
  await page.keyboard.type(text)
  await page.getByRole('button', { name: 'Détacher le post-it' }).click()

  const node = page.locator('.react-flow__node').filter({ hasText: text })
  await expect(node).toBeVisible()
  const id = await node.getAttribute('data-id')
  if (!id) throw new Error('post-it node has no data-id')

  const before = await getPostItPosition(page, id)

  const box = await node.boundingBox()
  if (!box) throw new Error('post-it node has no bounding box')
  const startX = box.x + box.width / 2
  const startY = box.y + box.height / 2
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX + 150, startY + 100, { steps: 10 })
  await page.mouse.up()

  await expect.poll(() => getPostItPosition(page, id)).not.toEqual(before)
  const afterDrag = await getPostItPosition(page, id)

  await page.reload()
  await expect(page.locator('.react-flow__node').filter({ hasText: text })).toBeVisible()
  const afterReload = await getPostItPosition(page, id)

  expect(afterReload).toEqual(afterDrag)
})
