import { apiRequest, apiUrl } from './apiClient'

export const adminApi = {
  deleteImage(imageHash: string, token: string) {
    return apiRequest<{ success?: boolean; data?: { linkedMealsDeleted?: number } }>(
      `/img/admin/${encodeURIComponent(imageHash)}`,
      { method: 'DELETE', headers: { Authorization: token } },
    )
  },

  syncMeals(token: string) {
    return apiRequest<{ success?: boolean }>('/meals/sync-now', {
      method: 'POST',
      headers: { Authorization: token },
    })
  },

  imageUrl(path: string) {
    return apiUrl(path)
  },
}
