import { expect, test } from '@playwright/test'
import { loadPage, preparePage, TEST_NOW } from './helpers'

test.describe('meal plan', () => {
  test.beforeEach(async ({ page }) => {
    await preparePage(page)
  })

  test('selects the current weekday on the initial render', async ({ page }) => {
    await loadPage(page)

    const today = new Date(TEST_NOW).getDay()
    const expectedIndex = today === 0 || today === 6 ? 0 : today - 1
    await expect(page.locator('.day-chip').nth(expectedIndex)).toHaveClass(/is-selected/)
  })

  test('changes the selected weekday and meal list', async ({ page }) => {
    const dayChips = page.locator('.day-chip')
    await expect(dayChips).toHaveCount(5)

    await dayChips.nth(1).click()

    await expect(dayChips.nth(1)).toHaveClass(/is-selected/)
    await expect(page.locator('.meal-title').first()).toHaveText('Tagesgericht 2')
  })

  test('switches to the next week and back', async ({ page }) => {
    const requestedStarts: string[] = []
    page.on('request', (request) => {
      const url = new URL(request.url())
      if (url.pathname.endsWith('/meals')) requestedStarts.push(url.searchParams.get('start') ?? '')
    })

    const nextWeekChip = page.locator('.week-chip').filter({ hasText: 'Nächste Woche' })
    const currentWeekChip = page.locator('.week-chip').filter({ hasText: 'Aktuelle Woche' })
    await expect(currentWeekChip).toHaveCount(0)

    await nextWeekChip.click()

    await expect(currentWeekChip).toBeVisible()
    await expect(nextWeekChip).toHaveCount(0)
    await expect.poll(() => requestedStarts).toContain('2025-01-13')
    await expect(page.locator('.day-chip').first()).toHaveClass(/is-selected/)
    await expect(page.locator('.meal-title').first()).toContainText('Gegrilltes Gemüse')

    await currentWeekChip.click()
    await expect(nextWeekChip).toBeVisible()
    await expect(currentWeekChip).toHaveCount(0)
  })

  test('opens the filter UI and applies the salad exclusion toggle', async ({ page }) => {
    await expect(page.locator('.meal-title').filter({ hasText: 'Bunter Salat' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Filter' }).click()
    await expect(page.locator('.filter-panel')).toBeVisible()

    const saladFilter = page.locator('button.filter-chip').filter({ hasText: 'Salate' })
    await expect(saladFilter).toBeVisible()
    await saladFilter.click()

    await expect(page.getByText('Bunter Salat', { exact: true })).toBeVisible()
  })

  test('shows student prices after enabling the price filter', async ({ page }) => {
    await expect(page.locator('.price-student')).toHaveCount(0)

    await page.getByRole('button', { name: 'Filter' }).click()
    await page.locator('.filter-switch-row').filter({ hasText: 'Studierendenpreise anzeigen' }).click()
    await page.getByRole('button', { name: 'Filter schließen' }).click()

    await expect(page.locator('.price-student').first()).toBeVisible()
  })
})
