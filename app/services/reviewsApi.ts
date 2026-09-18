import type { PaginatedMealReviewsResponse } from '~/types'
import { apiRequest } from './apiClient'

export const reviewsApi = {
  getForMeal(mealId: number) {
    return apiRequest<{ success: boolean; data: PaginatedMealReviewsResponse }>(
      `/meals/${mealId}/reviews?page=1&limit=50`,
    )
  },

  submit(mealId: number, payload: { star: number; comment: string; turnstileToken: string }) {
    return apiRequest<{ success: boolean }>(`/meals/${mealId}/reviews`, {
      method: 'POST',
      body: payload,
    })
  },
}
