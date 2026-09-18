import { expect, test } from '@playwright/test'
import { isMobileViewport, isWideViewport, preparePage } from './helpers'

test.describe('responsive filter UI', () => {
  test.beforeEach(async ({ page }) => {
    await preparePage(page)
  })

  test('uses the correct filter presentation for the viewport', async ({ page }) => {
    await page.getByRole('button', { name: 'Filter' }).click()

    if (isMobileViewport(page)) {
      await expect(page.locator('.filter-bottom-sheet')).toBeVisible()
      await expect(page.locator('.filter-dialog')).toHaveCount(0)
      await expect(page.locator('.filter-side-panel')).toHaveCount(0)
      await expect(page.locator('.filter-backdrop')).toBeVisible()
    } else if (isWideViewport(page)) {
      await expect(page.locator('.filter-side-panel')).toBeVisible()
      await expect(page.locator('.filter-dialog')).toHaveCount(0)
      await expect(page.locator('.filter-bottom-sheet')).toHaveCount(0)
    } else {
      await expect(page.locator('.filter-dialog')).toBeVisible()
      await expect(page.locator('.filter-bottom-sheet')).toHaveCount(0)
      await expect(page.locator('.filter-side-panel')).toHaveCount(0)
    }

    await expect(page.locator('.filter-panel')).toBeVisible()
    if (!isWideViewport(page)) {
      await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden')
    }
  })

  test('matches the current open-filter layout', async ({ page }) => {
    await page.getByRole('button', { name: 'Filter' }).click()
    await expect(page.locator('.filter-panel')).toBeVisible()

    await expect(page).toHaveScreenshot('filters-open.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('closes through the overlay and restores body scrolling', async ({ page }) => {
    test.skip(isWideViewport(page), 'The wide side panel has no backdrop or body scroll lock')

    await page.getByRole('button', { name: 'Filter' }).click()
    await page.locator('.filter-backdrop').click({ position: { x: 4, y: 4 } })

    await expect(page.locator('.filter-panel')).toBeHidden()
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('')
  })
})
