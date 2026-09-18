import { expect, type Page } from '@playwright/test'
import { installApiMocks } from '../fixtures/api'

export const TEST_NOW = '2025-01-06T12:00:00.000Z'

const disableAnimations = async (page: Page) => {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        scroll-behavior: auto !important;
      }
    `,
  })
}

export const loadPage = async (page: Page) => {
  await installApiMocks(page)
  await page.addInitScript(({ now }) => {
    const OriginalDate = Date
    const fixedTime = new OriginalDate(now).getTime()

    class FixedDate extends OriginalDate {
      constructor(...args: ConstructorParameters<typeof Date>) {
        if ((args as unknown[]).length === 0) {
          super(fixedTime)
        } else {
          super(...args)
        }
      }

      static now() {
        return fixedTime
      }
    }

    window.Date = FixedDate as unknown as DateConstructor
  }, { now: TEST_NOW })
  await page.goto('/')
  await expect(page.locator('.meal-card').first()).toBeVisible({ timeout: 30_000 })
  await disableAnimations(page)
}

export const preparePage = async (page: Page) => {
  await loadPage(page)

  // The application intentionally selects the current weekday. Selecting Monday
  // after loading makes the visual baseline independent of the calendar date.
  await page.locator('.day-chip').first().click()
  await expect(page.locator('.meal-title').first()).toContainText('Gegrilltes Gemüse')
}

export const isMobileViewport = (page: Page) => page.viewportSize()!.width < 768
export const isWideViewport = (page: Page) => page.viewportSize()!.width >= 2020
