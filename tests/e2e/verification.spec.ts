import { expect, test } from '@playwright/test'
import { installApiMocks } from '../fixtures/api'

test.describe('site verification', () => {
  test('keeps the meal plan and backend proxy locked without a valid code', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Access required' })).toBeVisible()
    await expect(page.locator('.meal-card')).toHaveCount(0)

    const response = await page.request.get('/api/backend/meals')
    expect(response.status()).toBe(401)
  })

  test('rejects an invalid code submitted through the login form', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Verification code').fill('invalid-code')
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('alert')).toHaveText('Invalid verification code.')
    await expect(page.locator('.meal-card')).toHaveCount(0)
  })

  test('opens the meal plan after a valid code is entered', async ({ page }) => {
    await installApiMocks(page)
    await page.goto('/')
    await page.getByLabel('Verification code').fill('test-verification-token')
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.locator('.meal-card').first()).toBeVisible()
  })
})
