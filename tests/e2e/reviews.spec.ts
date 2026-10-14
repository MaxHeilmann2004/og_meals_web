import { expect, test } from '@playwright/test'
import { isMobileViewport, preparePage } from './helpers'

const openFirstMealReviews = async (page: Parameters<typeof preparePage>[0]) => {
  await page.locator('.meal-card').first().locator('.meal-info-row').click()
  await expect(page.locator('.meal-detail-dialog')).toBeVisible()

  await expect(page.locator('.review-card')).toHaveCount(1)
  if (!isMobileViewport(page)) await expect(page.locator('.review-card')).toBeVisible()
}

test.describe('review modes', () => {
  test('renders star-only reviews without a comment field when text reviews are disabled', async ({ page }) => {
    await preparePage(page, { textReviewsEnabled: false })
    await openFirstMealReviews(page)
    if (isMobileViewport(page)) {
      await page.locator('.star-btn').last().evaluate((button) => (button as HTMLButtonElement).click())
    } else {
      await page.locator('.star-btn').last().click()
    }

    await expect(page.locator('.review-card-comment')).toHaveCount(0)
    await expect(page.locator('.custom-textarea')).toHaveCount(0)
    await expect(page.locator('.review-card-header .var-rate')).toHaveCount(1)
  })

  test('refreshes the setting when reopening reviews and hides previously visible comments', async ({ page }) => {
    let textReviewsEnabled = true
    await preparePage(page, { textReviewsEnabled: () => textReviewsEnabled })
    await openFirstMealReviews(page)
    await expect(page.locator('.review-card-comment')).toHaveText('Sehr lecker!')

    await page.locator('.dialog-close-btn').click()
    await expect(page.locator('.meal-detail-dialog')).toBeHidden()
    textReviewsEnabled = false

    await openFirstMealReviews(page)
    await expect(page.locator('.review-card-comment')).toHaveCount(0)
    await expect(page.locator('.review-card-header .var-rate')).toHaveCount(1)

    await page.locator('.dialog-close-btn').click()
    await expect(page.locator('.meal-detail-dialog')).toBeHidden()
    textReviewsEnabled = true

    await openFirstMealReviews(page)
    await expect(page.locator('.review-card-comment')).toHaveText('Sehr lecker!')
  })

  test('fails closed and reports the error when review settings cannot be loaded', async ({ page }) => {
    await preparePage(page, { reviewSettingsStatus: 500 })
    await openFirstMealReviews(page)

    await expect(page.locator('.review-settings-error')).toContainText('Review settings are unavailable.')
    await expect(page.locator('.review-card-comment')).toHaveCount(0)
  })
})
