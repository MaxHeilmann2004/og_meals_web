import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
// The standalone test TypeScript project does not process Vue SFCs; Vitest does via the Vue Vite plugin.
// @ts-expect-error Vue SFC import
import MealImage from '~/components/shared/MealImage.vue'
// @ts-expect-error Vue SFC import
import HorizontalCenteredHeroCarousel from '~/components/shared/HorizontalCenteredHeroCarousel.vue'

vi.mock('~/services/apiClient', () => ({ apiUrl: (path: string) => path }))

const image = { url: '/meal.jpg', aiSuggested: false }

describe('MealImage loading', () => {
  it('lazy-loads images by default', () => {
    const img = mount(MealImage, { props: { mealImage: image, contentDescription: 'Meal' } }).find('img')

    expect(img.attributes('loading')).toBe('lazy')
    expect(img.attributes('decoding')).toBe('async')
    expect(img.attributes('fetchpriority')).toBeUndefined()
  })

  it('loads priority images eagerly with high fetch priority', () => {
    const img = mount(MealImage, { props: { mealImage: image, contentDescription: 'Meal', priority: true } }).find('img')

    expect(img.attributes('loading')).toBe('eager')
    expect(img.attributes('fetchpriority')).toBe('high')
  })

  it('prioritizes only the first carousel slide', () => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    })

    const wrapper = mount(HorizontalCenteredHeroCarousel, {
      props: {
        images: [image, { url: '/other.jpg', aiSuggested: false }],
        contentDescription: 'Meal',
        priority: true,
      },
      global: { components: { MealImage }, stubs: { AiBadge: true } },
    })

    expect(wrapper.findAll('img').map(img => img.attributes('loading'))).toEqual(['eager', 'lazy'])
    vi.unstubAllGlobals()
  })
})
