import { describe, expect, it } from 'vitest'
import {
  cleanMealTitle,
  formatMealShortDate,
  formatNumber,
  formatPrice,
  formatRelativeDate,
  formatReviewStats,
  getMealCategoryName,
} from '~/utils/meal/formatters'

describe('presentation formatters', () => {
  it('formats shared meal presentation values', () => {
    expect(formatPrice(5.5)).toContain('5,50')
    expect(formatNumber(4.5, 1)).toBe('4,5')
    expect(cleanMealTitle('  Gemüse\nmit Reis  ')).toBe('Gemüse, mit Reis')
    expect(formatMealShortDate('2025-01-06T11:30:00.000Z')).toMatch(/Mo 6\.1/)
  })

  it('resolves category fallbacks in order', () => {
    expect(getMealCategoryName({ category: { unifiedName: '  Grill  ', name: 'Kategorie' } })).toBe('Grill')
    expect(getMealCategoryName({ category: { name: 'Kategorie' } })).toBe('Kategorie')
    expect(getMealCategoryName({}, 'Kantine')).toBe('Kantine')
  })

  it('formats review summaries and relative dates', () => {
    expect(formatReviewStats({ totalReviews: 0, averageStars: 0 })).toBe('Keine Bewertungen')
    expect(formatReviewStats({ totalReviews: 2, averageStars: 4.5 })).toBe('4,5 (2)')
    expect(formatRelativeDate(
      '2025-01-06T11:00:00.000Z',
      new Date('2025-01-06T12:00:00.000Z'),
    )).toBe('Vor 1 Std.')
  })
})
