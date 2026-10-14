import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
// The standalone test TypeScript project does not process Vue SFCs; Vitest does via the Vue Vite plugin.
// @ts-expect-error Vue SFC import
import HorizontalCenteredHeroCarousel from '~/components/shared/HorizontalCenteredHeroCarousel.vue'

describe('HorizontalCenteredHeroCarousel', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('emits the selected image index when another slide is clicked', async () => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    })

    const wrapper = mount(HorizontalCenteredHeroCarousel, {
      props: {
        images: [
          { url: '/first.jpg', aiSuggested: false },
          { url: '/second.jpg', aiSuggested: false },
        ],
        contentDescription: 'Meal',
      },
      global: {
        stubs: {
          MealImage: true,
          AiBadge: true,
        },
      },
    })

    await wrapper.findAll('.carousel-item')[1]!.trigger('click')

    expect(wrapper.emitted('image-change')).toEqual([[1]])
  })
})
