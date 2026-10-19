import { describe, expect, it } from 'vitest'
import type { Canteen, Meal } from '~/types'
import { getMealPlanImageLayout } from '~/utils/meal/imageLayout'
import { getMealCardModel, getStarState } from '~/utils/meal/cardModel'
import { normalizeCategoryName, selectMealPlanImageCanteens } from '~/utils/meal/imageSelection'
import { decodeEntities, restoreInlinedAssets } from '../../server/utils/mealPlanImage/markup'
import { getDefaultMealPlanImageDate, MealPlanImageOptionsError, parseMealPlanImageOptions } from '../../server/utils/mealPlanImage/options'

const canteen = (id: number, name: string): Canteen => ({
  id,
  name,
  displayName: name,
  orderInApp: id,
  hash: `hash-${id}`,
  outletId: id,
  locationInfo: { id, name },
})

const meal = (id: number, canteenId: number, categoryName: string, overrides: Partial<Meal> = {}): Meal => ({
  id,
  title: `Gericht ${id}`,
  price: 5,
  studentPrice: 3,
  date: '2025-01-06T11:00:00.000Z',
  canteenId,
  images: [],
  features: [],
  category: { id, name: categoryName },
  reviewStats: { totalReviews: 0, averageStars: 0 },
  ...overrides,
})

describe('meal plan image selection', () => {
  it('normalizes category names', () => {
    expect(normalizeCategoryName('Heimatküche')).toBe('heimatkuche')
    expect(normalizeCategoryName('Heimatkueche')).not.toBe('heimatkuche')
    expect(normalizeCategoryName('F&T Vegan')).toBe('ftvegan')
    expect(normalizeCategoryName('Live-Counter')).toBe('livecounter')
    expect(normalizeCategoryName(undefined)).toBe('')
  })

  it('keeps only Elbe and bonprix and only the allowed categories', () => {
    const canteens = [canteen(8, 'Elbe'), canteen(2, 'bonprix'), canteen(5, 'Andere')]
    const meals = [
      meal(1, 8, 'Grill'),
      meal(2, 8, 'Suppe'),
      meal(3, 8, 'The Original'),
      meal(4, 2, 'F&T Vegan'),
      meal(5, 2, 'Salat'),
      meal(6, 5, 'Grill'),
      meal(7, 8, 'Live-Counter'),
      meal(8, 8, 'Heimatküche'),
      meal(9, 8, 'Vital'),
      meal(10, 8, 'Pasta'),
      meal(11, 8, 'Pizza'),
    ]

    const result = selectMealPlanImageCanteens(canteens, meals, '2025-01-06')

    expect(result.map(entry => entry.id).sort()).toEqual([2, 8])
    expect(result.flatMap(entry => entry.mealsForSelectedDay.map(item => item.id)).sort((a, b) => a - b))
      .toEqual([1, 3, 4, 7, 8, 9, 10, 11])
  })

  it('omits canteens without matching meals and meals of other days', () => {
    const result = selectMealPlanImageCanteens(
      [canteen(8, 'Elbe'), canteen(2, 'bonprix')],
      [meal(1, 8, 'Grill', { date: '2025-01-07T11:00:00.000Z' }), meal(2, 2, 'Suppe')],
      '2025-01-06',
    )

    expect(result).toEqual([])
  })
})

describe('meal plan image layout', () => {
  it('derives columns like the CSS grid', () => {
    expect(getMealPlanImageLayout(1300).columns).toBe(3)
    expect(getMealPlanImageLayout(2400).columns).toBe(3)
    expect(getMealPlanImageLayout(900).columns).toBe(2)
    expect(getMealPlanImageLayout(480).columns).toBe(1)
    expect(getMealPlanImageLayout(320).columns).toBe(1)
  })

  it('fits cards into the content width', () => {
    const layout = getMealPlanImageLayout(1300)
    expect(layout.cardWidth * layout.columns + 16 * (layout.columns - 1)).toBeLessThanOrEqual(layout.contentWidth)
    expect(layout.mediaHeight).toBe(Math.round((layout.mediaWidth * 9) / 16))
  })
})

describe('meal card model', () => {
  it('computes star states', () => {
    expect([1, 2, 3, 4, 5].map(position => getStarState(3.5, position)))
      .toEqual(['full', 'full', 'full', 'half', 'empty'])
  })

  it('exposes overview features and AI image state', () => {
    const model = getMealCardModel(meal(1, 8, 'Grill', {
      images: [{ url: '/img/1', aiSuggested: true }],
      features: [{ id: 1, showInOverview: true }, { id: 2, showInOverview: false }],
      reviewStats: { totalReviews: 2, averageStars: 4 },
    } as Partial<Meal>), 'Elbe')

    expect(model.imageUrl).toBe('/img/1')
    expect(model.aiSuggested).toBe(true)
    expect(model.hasReviews).toBe(true)
    expect(model.features.map(feature => feature.id)).toEqual([1])
  })
})

describe('meal plan image options', () => {
  const now = new Date('2025-01-08T10:00:00.000Z')

  it('uses defaults', () => {
    expect(parseMealPlanImageOptions({}, now)).toMatchObject({
      date: '2025-01-08',
      width: 1300,
      scale: 1,
      theme: 'light',
      studentPrices: false,
      inline: false,
    })
  })

  it('parses explicit values', () => {
    expect(parseMealPlanImageOptions({
      date: '2025-02-03',
      width: '800',
      scale: '2',
      theme: 'dark',
      studentPrices: '1',
      inline: '1',
    }, now)).toEqual({
      date: '2025-02-03',
      width: 800,
      scale: 2,
      theme: 'dark',
      studentPrices: true,
      inline: true,
    })
  })

  it.each([
    { date: '2025-02-30' },
    { date: 'heute' },
    { width: '10' },
    { width: '99999' },
    { width: 'abc' },
    { scale: '9' },
    { theme: 'blue' },
  ])('rejects invalid input %j', (query) => {
    expect(() => parseMealPlanImageOptions(query, now)).toThrowError(MealPlanImageOptionsError)
  })

  it('rolls weekends over to Monday in Berlin time', () => {
    expect(getDefaultMealPlanImageDate(new Date('2025-01-11T10:00:00.000Z'))).toBe('2025-01-13')
    expect(getDefaultMealPlanImageDate(new Date('2025-01-12T10:00:00.000Z'))).toBe('2025-01-13')
    expect(getDefaultMealPlanImageDate(new Date('2025-01-10T23:30:00.000Z'))).toBe('2025-01-13')
    expect(getDefaultMealPlanImageDate(new Date('2025-01-13T10:00:00.000Z'))).toBe('2025-01-13')
  })
})

describe('markup entity decoding', () => {
  it('decodes entities in nested text nodes', () => {
    const tree = { type: 'div', props: { children: ['F&amp;T Vegan', { type: 'span', props: { children: '&lt;&#39;&#x41;&quot;' } }] } }
    expect(decodeEntities(tree)).toEqual({
      type: 'div',
      props: { children: ['F&T Vegan', { type: 'span', props: { children: '<\'A"' } }] },
    })
  })
})

describe('inlined asset restoration', () => {
  it('replaces asset tokens with data URIs in nested vnodes', () => {
    const assets = new Map([['asset:0', 'data:image/jpeg;base64,AAAA']])
    const tree = { type: 'div', props: { children: [{ type: 'img', props: { src: 'asset:0' } }, { type: 'img', props: { src: '/other.png' } }] } }

    restoreInlinedAssets(tree, assets)

    expect(tree.props.children.map(child => child.props.src)).toEqual(['data:image/jpeg;base64,AAAA', '/other.png'])
  })
})
