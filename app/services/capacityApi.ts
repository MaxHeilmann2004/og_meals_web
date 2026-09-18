import type {
  CanteenCapacityApiResponse,
  CanteenCapacityTimelineApiResponse,
} from '~/types'
import { apiRequest } from './apiClient'

export const capacityApi = {
  getCurrent() {
    return apiRequest<CanteenCapacityApiResponse>('/capacity/current')
  },

  getTimeline(canteenId: number, date: string) {
    return apiRequest<CanteenCapacityTimelineApiResponse>(
      `/capacity/timeline?canteenId=${canteenId}&date=${encodeURIComponent(date)}`,
    )
  },
}
