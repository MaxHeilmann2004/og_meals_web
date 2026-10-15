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

  test('fails closed when the backend cannot verify a submitted code', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Verification code').fill('backend-unavailable')
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('alert')).toHaveText('Could not verify access with the backend.')
    await expect(page.locator('.meal-card')).toHaveCount(0)
  })

  test('accepts a raw numeric QR value as the verification code', async ({ page }) => {
    await installApiMocks(page)
    await page.goto('/')
    await page.getByLabel('Verification code').fill('1234567890123')
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.locator('.meal-card').first()).toBeVisible()
    const cookie = (await page.context().cookies()).find(item => item.name === 'og-meals-verification')
    expect(cookie?.httpOnly).toBe(true)
    expect(cookie?.expires).toBeGreaterThan(Date.now() / 1000 + 390 * 24 * 60 * 60)

    const refreshedStatus = await page.evaluate(async () => {
      const response = await fetch('/api/verification')
      return response.json()
    })
    expect(refreshedStatus).toMatchObject({ configured: true, authenticated: true })

    await page.route('**/api/backend/meals?proxy-test=1', (route) => route.continue())
    const proxyStatus = await page.evaluate(async () => {
      const response = await fetch('/api/backend/meals?proxy-test=1')
      return response.status
    })
    expect(proxyStatus).toBe(200)
  })

  test('keeps manual entry available when camera permission is denied', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')),
        },
      })
    })
    await page.goto('/')
    await page.getByRole('button', { name: 'Scan QR code' }).click()

    await expect(page.getByRole('alert')).toContainText('Camera access was denied.')
    await expect(page.getByLabel('Verification code')).toBeVisible()
  })

  test('opens the meal plan after a valid code is entered', async ({ page }) => {
    await installApiMocks(page)
    await page.goto('/')
    await page.getByLabel('Verification code').fill('test-verification-token')
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.locator('.meal-card').first()).toBeVisible()
    await page.route('**/api/backend/meals?proxy-test=1', (route) => route.continue())
    const upstreamStatus = await page.evaluate(async () => {
      const response = await fetch('/api/backend/meals?proxy-test=1')
      return response.status
    })
    expect(upstreamStatus).toBe(200)
  })
})
