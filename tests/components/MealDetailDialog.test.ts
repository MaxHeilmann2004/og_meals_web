import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
// The standalone test TypeScript project does not process Vue SFCs; Vitest does via the Vue Vite plugin.
// @ts-expect-error Vue SFC import
import MealDetailDialog from '~/components/meal-detail/MealDetailDialog.vue'
import type { Canteen, Meal } from '~/types'

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

const VarPopupStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
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
  title: 'Gegrilltes Gemüse',
  price: 5.5,
  studentPrice: 3.9,
  date: '2025-01-06T11:30:00.000Z',
  canteenId: canteen.id,
  images: [],
  features: [],
  reviewStats: { totalReviews: 0, averageStars: 0 },
}

describe('MealDetailDialog', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('tracks image changes with the dialog meal context', async () => {
    const trackEvent = vi.fn()
    vi.stubGlobal('useTrackEvent', trackEvent)
    const wrapper = mount(MealDetailDialog, {
      props: {
        show: true,
        meal,
        canteen,
        weekday: 'Montag',
        isMobile: false,
        isAdmin: false,
        adminToken: '',
      },
      global: {
        stubs: {
          MealMedia: MealMediaStub,
          MealDetailSummary: true,
          MealNutritionTable: true,
          MealAllergensList: true,
          MealFeaturesList: true,
          MealReviewsSection: true,
          MealAdminTools: true,
          'var-popup': VarPopupStub,
          'var-collapse': true,
          'var-collapse-item': true,
        },
      },
    })

    await wrapper.find('.meal-media-stub').trigger('click')

    expect(trackEvent).toHaveBeenCalledWith('Change Meal Image', {
      props: {
        canteen: 'Kantine Elbe',
        weekday: 'Montag',
        layout: 'desktop',
        meal_id: '101',
        meal_image_index: '1',
      },
    })
  })
})
