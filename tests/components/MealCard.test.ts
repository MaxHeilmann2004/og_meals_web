import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
// The standalone test TypeScript project does not process Vue SFCs; Vitest does via the Vue Vite plugin.
// @ts-expect-error Vue SFC import
import MealCard from '~/components/meal-plan/MealCard.vue'
import type { Canteen, Meal } from '~/types'
import { useFilterStore } from '~/stores/filters'

const MealMediaStub = defineComponent({
  name: 'MealMedia',
  emits: ['image-change'],
  setup(_, { emit }) {
    return () => h('button', {
      class: 'meal-media-stub',
      onClick: () => emit('image-change', 1),
    })
  },
})

const canteen: Canteen = {
  id: 8,
  name: 'Elbe',
  displayName: 'Kantine Elbe',
  hash: 'elbe',
  orderInApp: 1,
  outletId: 8,
  locationInfo: { id: 8, name: 'Hamburg' },
}

const meal: Meal = {
  id: 101,
  title: '  Gemüse\nmit Reis  ',
  price: 5.5,
  studentPrice: 3.9,
  date: '2025-01-06T11:30:00.000Z',
  canteenId: canteen.id,
  images: [],
  features: [{ id: 25, name: 'Vegetarisch', showInOverview: true }],
  category: { id: 201, name: 'Hauptgericht', unifiedName: 'Tagesgericht' },
  reviewStats: { totalReviews: 2, averageStars: 4.5 },
}

describe('MealCard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mountCard = () => mount(MealCard, {
    props: { meal, canteen, weekday: 'Montag', layout: 'mobile' },
    global: {
      stubs: {
        MealMedia: MealMediaStub,
        HorizontalCenteredHeroCarousel: true,
        MealImage: true,
        MealIcon: true,
      },
      directives: {
        ripple: {},
      },
    },
  })

  it('renders the current meal presentation', () => {
    const wrapper = mountCard()

    expect(wrapper.find('.meal-title').text()).toBe('Gemüse, mit Reis')
    expect(wrapper.find('.category-name').text()).toBe('Tagesgericht')
    expect(wrapper.find('.price-regular').text()).toContain('5,50')
    expect(wrapper.find('.meal-rating-row').text()).toContain('4.5 (2)')
    expect(wrapper.findComponent({ name: 'MealIcon' }).exists()).toBe(true)
  })

  it('uses the student price when the preference is enabled', () => {
    const store = useFilterStore()
    store.showStudentPrices = true
    const wrapper = mountCard()

    expect(wrapper.find('.price-regular').classes()).toContain('has-student-price')
    expect(wrapper.find('.price-student').text()).toContain('3,90')
  })

  it('emits selection for pointer and keyboard activation', async () => {
    const wrapper = mountCard()

    await wrapper.trigger('click')
    await wrapper.trigger('keydown.enter')
    await wrapper.trigger('keydown.space')

    expect(wrapper.emitted('select')).toHaveLength(3)
  })

  it('tracks image changes with the meal card context', async () => {
    const trackEvent = vi.fn()
    vi.stubGlobal('useTrackEvent', trackEvent)
    const wrapper = mountCard()

    await wrapper.find('.meal-media-stub').trigger('click')

    expect(trackEvent).toHaveBeenCalledWith('Change Meal Image', {
      props: {
        canteen: 'Kantine Elbe',
        weekday: 'Montag',
        layout: 'mobile',
        meal_id: '101',
        meal_image_index: '1',
      },
    })
  })
})
