import { expect, test } from '@playwright/test'
import { installApiMocks } from '../fixtures/api'

test.describe('site verification', () => {
  test('keeps the meal plan and backend proxy locked without a valid code', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Zugriff erforderlich' })).toBeVisible()
    await expect(page.locator('.meal-card')).toHaveCount(0)

    const response = await page.request.get('/api/backend/meals')
    expect(response.status()).toBe(401)
  })

  test('rejects an invalid code submitted through the login form', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Verifizierungscode').fill('invalid-code')
    await page.getByRole('button', { name: 'Weiter' }).click()

    await expect(page.getByRole('alert')).toHaveText('Ungültiger Verifizierungscode.')
    await expect(page.locator('.meal-card')).toHaveCount(0)
  })

  test('fails closed when the backend cannot verify a submitted code', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Verifizierungscode').fill('backend-unavailable')
    await page.getByRole('button', { name: 'Weiter' }).click()

    await expect(page.getByRole('alert')).toHaveText('Der Zugriff konnte beim Backend nicht überprüft werden.')
    await expect(page.locator('.meal-card')).toHaveCount(0)
  })

  test('accepts a raw numeric QR value as the verification code', async ({ page }) => {
    await installApiMocks(page)
    await page.goto('/')
    await page.getByLabel('Verifizierungscode').fill('1234567890123')
    await page.getByRole('button', { name: 'Weiter' }).click()

    await expect(page.locator('.meal-card').first()).toBeVisible()
    const cookie = (await page.context().cookies()).find(item => item.name === 'og-meals-verification')
    expect(cookie?.httpOnly).toBe(true)
    expect(cookie?.sameSite).toBe('Lax')
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

  test('opens a shared verification link from another site', async ({ page }) => {
    await installApiMocks(page)
    let cleanPageCookie = ''
    let resolveCleanPageRequest!: () => void
    const cleanPageRequest = new Promise<void>((resolve) => {
      resolveCleanPageRequest = resolve
    })
    page.on('request', async (request) => {
      const url = new URL(request.url())
      if (
        !request.isNavigationRequest()
        || url.origin !== 'http://127.0.0.1:4173'
        || url.pathname !== '/'
        || url.searchParams.has('verification')
      ) return

      cleanPageCookie = (await request.allHeaders()).cookie ?? ''
      resolveCleanPageRequest()
    })
    await page.route('http://outside.test/**', route => route.fulfill({
      contentType: 'text/html',
      body: '<a href="http://127.0.0.1:4173/?verification=test-verification-token">Open shared link</a>',
    }))

    await page.goto('http://outside.test/')
    await page.getByRole('link', { name: 'Open shared link' }).click()

    await expect(page.locator('.meal-card').first()).toBeVisible()
    await cleanPageRequest
    expect(cleanPageCookie).toContain('og-meals-verification=test-verification-token')
    expect(new URL(page.url()).searchParams.has('verification')).toBe(false)
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
    await page.getByRole('button', { name: 'QR-Code scannen' }).click()

    await expect(page.getByRole('alert')).toContainText('Der Kamerazugriff wurde verweigert.')
    await expect(page.getByLabel('Verifizierungscode')).toBeVisible()
  })

  test('opens the meal plan after a valid code is entered', async ({ page }) => {
    await installApiMocks(page)
    await page.goto('/')
    await page.getByLabel('Verifizierungscode').fill('test-verification-token')
    await page.getByRole('button', { name: 'Weiter' }).click()

    await expect(page.locator('.meal-card').first()).toBeVisible()
    await page.route('**/api/backend/meals?proxy-test=1', (route) => route.continue())
    const upstreamStatus = await page.evaluate(async () => {
      const response = await fetch('/api/backend/meals?proxy-test=1')
      return response.status
    })
    expect(upstreamStatus).toBe(200)
  })
})
