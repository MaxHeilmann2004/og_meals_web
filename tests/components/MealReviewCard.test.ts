import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
// The standalone test TypeScript project does not process Vue SFCs; Vitest does via the Vue Vite plugin.
// @ts-expect-error Vue SFC import
import MealReviewCard from '~/components/reviews/MealReviewCard.vue'
import type { MealReviewItem } from '~/types'

const review: MealReviewItem = {
  id: 1,
  star: 5,
  comment: 'Sehr lecker!',
  createdAt: '2025-01-06T10:00:00.000Z',
  mealId: 101,
  isFromOriginalMeal: true,
  matchType: 'original',
}

describe('MealReviewCard', () => {
  it('hides comments when text reviews are disabled and shows them when enabled', async () => {
    const wrapper = mount(MealReviewCard, {
      props: { review, isMobile: false, textReviewsEnabled: true },
      global: { stubs: { 'var-rate': true, AiBadge: true } },
    })

    expect(wrapper.find('.review-card-comment').text()).toBe('Sehr lecker!')

    await wrapper.setProps({ textReviewsEnabled: false })
    expect(wrapper.find('.review-card-comment').exists()).toBe(false)

    await wrapper.setProps({ textReviewsEnabled: true })
    expect(wrapper.find('.review-card-comment').text()).toBe('Sehr lecker!')
  })

  it('does not render an empty comment', () => {
    const wrapper = mount(MealReviewCard, {
      props: {
        review: { ...review, comment: '' },
        isMobile: false,
        textReviewsEnabled: true,
      },
      global: { stubs: { 'var-rate': true, AiBadge: true } },
    })

    expect(wrapper.find('.review-card-comment').exists()).toBe(false)
  })
})
