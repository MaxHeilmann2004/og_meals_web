import type { MealsApiResponse } from '~/types'
import { apiRequest, apiUrl } from './apiClient'

export const mealsApi = {
  getWeek(start: string, end: string) {
    return apiRequest<MealsApiResponse>(`/meals?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
  },

  getDetailsUrl(mealId: number, adminToken?: string) {
    const url = new URL(apiUrl(`/meals/${mealId}`))
    if (adminToken) url.searchParams.set('adminToken', adminToken)
    return url.toString()
  },
}
