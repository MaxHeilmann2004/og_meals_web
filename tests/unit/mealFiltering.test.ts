import { describe, expect, it } from 'vitest'
import type { Meal } from '~/types'
import { filterMealsForDay, matchesMealFilters } from '~/utils/mealFiltering'

const meal = (overrides: Partial<Meal>): Meal => ({
  id: 1,
  title: 'Testgericht',
  price: 5,
  studentPrice: 3,
  date: '2025-01-06T11:00:00.000Z',
  canteenId: 8,
  images: [],
  features: [],
  category: { id: 201, name: 'Hauptgericht' },
  reviewStats: { totalReviews: 0, averageStars: 0 },
  ...overrides,
})

describe('meal filtering', () => {
  it('applies salad and feature exclusions', () => {
    expect(matchesMealFilters(meal({ category: { id: 235 } }), {
      isSaladExcluded: true,
      excludedFeatureIds: new Set(),
      includedFeatureIds: [],
    })).toBe(false)

    expect(matchesMealFilters(meal({ features: [{ id: 15 }] }), {
      isSaladExcluded: false,
      excludedFeatureIds: new Set([15]),
      includedFeatureIds: [],
    })).toBe(false)
  })

  it('treats vegan meals as satisfying the vegetarian filter', () => {
    expect(matchesMealFilters(meal({ features: [{ id: 11 }] }), {
      isSaladExcluded: false,
      excludedFeatureIds: new Set(),
      includedFeatureIds: [25],
    })).toBe(true)
  })

  it('requires all included features and scopes results to date and canteen', () => {
    const meals = [
      meal({ id: 1, features: [{ id: 25 }, { id: 12 }] }),
      meal({ id: 2, canteenId: 2, features: [{ id: 25 }, { id: 12 }] }),
      meal({ id: 3, date: '2025-01-07T11:00:00.000Z', features: [{ id: 25 }, { id: 12 }] }),
      meal({ id: 4, features: [{ id: 25 }] }),
    ]

    const result = filterMealsForDay(meals, 8, '2025-01-06', {
      isSaladExcluded: false,
      excludedFeatureIds: new Set(),
      includedFeatureIds: [25, 12],
    })

    expect(result.map(item => item.id)).toEqual([1])
  })
})
