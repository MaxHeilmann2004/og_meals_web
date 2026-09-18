import { describe, expect, it } from 'vitest'
import { compareMealsByCategory } from '~/utils/mealOrder'

describe('compareMealsByCategory', () => {
  it('keeps the configured category order', () => {
    const grill = { category: { id: 204 } }
    const soup = { category: { id: 233 } }
    const dessert = { category: { id: 1540 } }

    expect(compareMealsByCategory(grill, soup)).toBeLessThan(0)
    expect(compareMealsByCategory(soup, dessert)).toBeLessThan(0)
  })

  it('groups equivalent categories together', () => {
    expect(compareMealsByCategory(
      { category: { id: 204 } },
      { category: { id: 1676 } },
    )).toBe(0)
  })

  it('places unknown and missing categories after known categories', () => {
    expect(compareMealsByCategory(
      { category: { id: 999999 } },
      { category: { id: 204 } },
    )).toBeGreaterThan(0)
    expect(compareMealsByCategory({}, { category: { id: 204 } })).toBeGreaterThan(0)
  })
})
