import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
// The standalone test TypeScript project does not process Vue SFCs; Vitest does via the Vue Vite plugin.
// @ts-expect-error Vue SFC import
import MealAdminTools from '~/components/meal-detail/MealAdminTools.vue'
import type { Meal } from '~/types'

const { deleteImageMock, imageUrlMock } = vi.hoisted(() => ({
  deleteImageMock: vi.fn(),
  imageUrlMock: vi.fn((path: string) => `/api/backend${path}`),
}))

vi.mock('~/services/adminApi', () => ({
  adminApi: {
    deleteImage: deleteImageMock,
    imageUrl: imageUrlMock,
  },
}))

const VarButtonStub = defineComponent({
  inheritAttrs: false,
  props: { disabled: Boolean },
  emits: ['click'],
  setup(props, { attrs, emit, slots }) {
    return () => h('button', {
      ...attrs,
      disabled: props.disabled,
      onClick: () => emit('click'),
    }, slots.default?.())
  },
})

const meal: Meal = {
  id: 101,
  title: 'Gegrilltes Gemüse',
  price: 5.5,
  studentPrice: null,
  date: '2025-01-06T11:30:00.000Z',
  canteenId: 8,
  images: [{ url: '/img/meal-101-a.webp', aiSuggested: false }],
  features: [],
  category: { id: 201, name: 'Hauptgericht', unifiedName: 'Hauptgericht' },
  reviewStats: { totalReviews: 0, averageStars: 0 },
}

describe('MealAdminTools', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    deleteImageMock.mockReset()
    imageUrlMock.mockClear()
  })

  it('deletes an image with a relative backend URL', async () => {
    deleteImageMock.mockResolvedValue({
      success: true,
      data: { linkedMealsDeleted: 1 },
    })
    vi.stubGlobal('confirm', vi.fn(() => true))
    const wrapper = mount(MealAdminTools, {
      props: { meal, adminToken: 'admin-token' },
      global: {
        stubs: {
          'var-button': VarButtonStub,
          LoadingSpinner: true,
        },
      },
    })

    await wrapper.find('.admin-image-row button').trigger('click')
    await flushPromises()

    expect(deleteImageMock).toHaveBeenCalledWith('meal-101-a', 'admin-token')
    expect(wrapper.emitted('images-updated')).toEqual([[[]]])
    expect(wrapper.find('.admin-image-success').text()).toContain('Image deleted (1 linked meal references removed).')
  })
})
