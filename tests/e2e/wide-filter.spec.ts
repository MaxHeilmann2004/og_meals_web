import { expect, test } from '@playwright/test'
import { preparePage } from './helpers'

test('uses the side-panel filter layout on wide screens', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 2000, 'Only runs in the wide viewport project')

  await preparePage(page)
  await page.getByRole('button', { name: 'Filter' }).click()

  await expect(page.locator('.filter-side-panel')).toBeVisible()
  await expect(page.locator('.filter-dialog')).toHaveCount(0)
  await expect(page.locator('.filter-bottom-sheet')).toHaveCount(0)
  await expect(page).toHaveScreenshot('wide-filter-open.png', {
    fullPage: true,
    animations: 'disabled',
  })
})
