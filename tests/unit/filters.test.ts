import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFilterStore } from '~/stores/filters'

describe('filter store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('uses the current default canteen visibility', () => {
    const store = useFilterStore()

    expect(store.isCanteenEnabled(8)).toBe(true)
    expect(store.isCanteenEnabled(2)).toBe(true)
    expect(store.isCanteenEnabled(4)).toBe(false)
    expect(store.isCanteenEnabled(9)).toBe(false)
  })

  it('initializes newly discovered canteens without overwriting choices', () => {
    const store = useFilterStore()

    store.initFromCanteens([{ id: 8 }, { id: 4 }, { id: 99 }])
    expect(store.isCanteenEnabled(8)).toBe(true)
    expect(store.isCanteenEnabled(4)).toBe(false)
    expect(store.isCanteenEnabled(99)).toBe(true)

    store.toggleCanteen(8)
    store.initFromCanteens([{ id: 8 }])
    expect(store.isCanteenEnabled(8)).toBe(false)
  })

  it('toggles exclusion and inclusion filters independently', () => {
    const store = useFilterStore()

    expect(store.isSaladExcluded).toBe(true)
    store.toggleSaladExclusion()
    expect(store.isSaladExcluded).toBe(false)

    store.toggleFeatureExclusion(15)
    expect(store.isFeatureExcluded(15)).toBe(true)
    store.toggleFeatureExclusion(15)
    expect(store.isFeatureExcluded(15)).toBe(false)

    store.toggleFeatureInclusion(25)
    expect(store.isFeatureIncluded(25)).toBe(true)
    store.toggleFeatureInclusion(25)
    expect(store.isFeatureIncluded(25)).toBe(false)
  })

  it('counts active filters, including the default salad exclusion', () => {
    const store = useFilterStore()

    expect(store.activeFilterCount).toBe(1)
    store.toggleCanteen(8)
    store.toggleFeatureExclusion(15)
    store.toggleFeatureInclusion(25)
    store.toggleStudentPrices()
    expect(store.activeFilterCount).toBe(5)
  })
})
