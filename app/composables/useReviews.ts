import { ref, watch, type Ref } from 'vue'
import type { MealReviewItem, MealReviewStats } from '~/types'
import { reviewsApi } from '~/services/reviewsApi'

export const useReviews = (
  mealId: Ref<number>,
  show: Ref<boolean>,
  onStatsUpdated: (stats: MealReviewStats) => void,
) => {
  const reviews = ref<MealReviewItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchReviews = async (id = mealId.value) => {
    if (!id) return
    isLoading.value = true
    error.value = null
    try {
      const response = await reviewsApi.getForMeal(id)
      if (response.success && response.data) {
        reviews.value = response.data.reviews
        onStatsUpdated(response.data.stats)
      }
    } catch (requestError) {
      console.error('Failed to fetch reviews:', requestError)
      error.value = 'Fehler beim Laden der Bewertungen'
    } finally {
      isLoading.value = false
    }
  }

  watch(mealId, (id) => {
    if (id && show.value) void fetchReviews(id)
  })

  watch(show, (isVisible) => {
    if (isVisible) void fetchReviews()
  }, { immediate: true })

  return { reviews, isLoading, error, fetchReviews }
}
