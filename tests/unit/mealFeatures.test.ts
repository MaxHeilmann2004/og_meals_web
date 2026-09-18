import { describe, expect, it } from 'vitest'
import { getFeatureColor, getFeatureIconUrl } from '~/utils/mealFeatures'

describe('meal feature presentation', () => {
  it('maps known features to their icons and colors', () => {
    expect(getFeatureIconUrl({ id: 11 })).toBe('/icons/ic_mf_vegan.svg')
    expect(getFeatureColor({ id: 11 })).toBe('#4CAF50')
    expect(getFeatureIconUrl({ id: 999 })).toBeNull()
  })

  it('provides a theme fallback for unknown feature colors', () => {
    expect(getFeatureColor({ id: 999 })).toBe('var(--color-secondary)')
  })
})
