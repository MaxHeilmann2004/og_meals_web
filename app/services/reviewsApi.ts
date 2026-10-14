import type { PaginatedMealReviewsResponse, ReviewSettingsApiResponse } from '~/types'
import { apiRequest } from './apiClient'

export const reviewsApi = {
  getSettings() {
    return apiRequest<ReviewSettingsApiResponse>('/reviews/settings')
  },

  getForMeal(mealId: number) {
    return apiRequest<{ success: boolean; data: PaginatedMealReviewsResponse }>(
      `/meals/${mealId}/reviews?page=1&limit=50`,
    )
  },

  submit(mealId: number, payload: { star: number; comment?: string; turnstileToken: string }) {
    return apiRequest<{ success: boolean }>(`/meals/${mealId}/reviews`, {
      method: 'POST',
      body: payload,
    })
  },
}
