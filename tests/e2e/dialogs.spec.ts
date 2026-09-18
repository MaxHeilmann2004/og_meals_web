import { expect, test } from '@playwright/test'
import { isMobileViewport, preparePage } from './helpers'

test.describe('dialogs', () => {
  test.beforeEach(async ({ page }) => {
    await preparePage(page)
  })

  test('opens the meal detail dialog and preserves its layout', async ({ page }) => {
    // Click the stable information area rather than a carousel item so the test
    // exercises card selection without triggering carousel navigation.
    await page.locator('.meal-card').first().locator('.meal-info-row').click()

    await expect(page.locator('.meal-detail-dialog')).toBeVisible()
    await expect(page.locator('.meal-title').last()).toContainText('Gegrilltes Gemüse')
    await expect(page.locator('.detail-collapse')).toBeVisible()

    if (isMobileViewport(page)) {
      await page.getByText('Bewertungen (1)', { exact: true }).click()
    } else {
      const mealTop = await page.locator('.dialog-left-col').evaluate((element) => element.getBoundingClientRect().top)
      const reviewTop = await page.locator('.add-review-container').evaluate((element) => element.getBoundingClientRect().top)
      expect(Math.abs(mealTop - reviewTop)).toBeLessThanOrEqual(4)
    }
    await expect(page.locator('.review-card')).toContainText('Sehr lecker!')

    await expect(page).toHaveScreenshot('meal-detail-open.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('opens the capacity dialog', async ({ page }) => {
    await page.locator('.capacity-badge').first().click()

    await expect(page.locator('.capacity-dialog')).toBeVisible()
    await expect(page.locator('.capacity-chart-section')).toBeVisible()
    await expect(page).toHaveScreenshot('capacity-dialog-open.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('opens and closes the imprint dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Impressum' }).click()

    await expect(page.locator('.imprint-dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Impressum' })).toBeVisible()
    await expect(page.locator('.imprint-dialog')).toHaveScreenshot('imprint-dialog-open.png', {
      animations: 'disabled',
    })

    await page.getByRole('button', { name: 'Impressum schließen' }).click()
    await expect(page.locator('.imprint-dialog')).toBeHidden()
  })
})
