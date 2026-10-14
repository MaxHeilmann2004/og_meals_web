import { ref, watch, type Ref } from 'vue'
import type { MealReviewItem, MealReviewStats } from '~/types'
import { reviewsApi } from '~/services/reviewsApi'
import { useReviewSettings } from './useReviewSettings'

export const useReviews = (
  mealId: Ref<number>,
  show: Ref<boolean>,
  onStatsUpdated: (stats: MealReviewStats) => void,
) => {
  const reviews = ref<MealReviewItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const {
    textReviewsEnabled,
    isSettingsLoading,
    settingsError,
    loadSettings,
  } = useReviewSettings()
  let latestRequestId = 0

  const fetchReviews = async (id = mealId.value) => {
    if (!id) return
    const requestId = ++latestRequestId
    isLoading.value = true
    error.value = null

    await loadSettings(true)

    try {
      const response = await reviewsApi.getForMeal(id)
      if (!response.success || !response.data) throw new Error('The reviews response was invalid.')
      if (requestId !== latestRequestId) return

      reviews.value = response.data.reviews
      onStatsUpdated(response.data.stats)
    } catch (requestError) {
      console.error('Failed to fetch reviews:', requestError)
      if (requestId === latestRequestId) error.value = 'Fehler beim Laden der Bewertungen'
    } finally {
      if (requestId === latestRequestId) isLoading.value = false
    }
  }

  watch(mealId, (id) => {
    if (id && show.value) void fetchReviews(id)
  })

  watch(show, (isVisible) => {
    if (isVisible) void fetchReviews()
  }, { immediate: true })

  return {
    reviews,
    isLoading,
    error,
    textReviewsEnabled,
    isSettingsLoading,
    settingsError,
    fetchReviews,
  }
}
