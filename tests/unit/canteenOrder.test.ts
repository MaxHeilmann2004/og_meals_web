import { describe, expect, it } from 'vitest'
import { compareCanteens } from '~/utils/canteenOrder'

describe('compareCanteens', () => {
  it('uses the application priority for known canteens', () => {
    expect(compareCanteens({ id: 8 }, { id: 2 })).toBeLessThan(0)
    expect(compareCanteens({ id: 2 }, { id: 8 })).toBeGreaterThan(0)
  })

  it('falls back to orderInApp for otherwise equal priorities', () => {
    expect(compareCanteens({ id: 100, orderInApp: 1 }, { id: 101, orderInApp: 2 })).toBeLessThan(0)
    expect(compareCanteens({ id: 100 }, { id: 101, orderInApp: 2 })).toBeGreaterThan(0)
  })
})
