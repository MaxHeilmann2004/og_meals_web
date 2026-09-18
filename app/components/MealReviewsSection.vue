<template>
  <div class="reviews-section-content" :class="{ 'is-mobile': isMobile }">
    <MealReviewForm
      :meal-id="mealId"
      :show="show"
      :is-mobile="isMobile"
      @submitted="fetchReviews(mealId)"
    />

    <MealReviewList
      :reviews="reviews"
      :is-loading="isReviewsLoading"
      :error="reviewsError"
      :is-mobile="isMobile"
      @retry="fetchReviews(mealId)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { MealReviewItem, MealReviewStats, PaginatedMealReviewsResponse } from '~/types/meals'
import MealReviewForm from './MealReviewForm.vue'
import MealReviewList from './MealReviewList.vue'

const props = defineProps<{
  mealId: number
  show: boolean
  isMobile: boolean
}>()

const emit = defineEmits<{
  'stats-updated': [stats: MealReviewStats]
}>()

const reviews = ref<MealReviewItem[]>([])
const isReviewsLoading = ref(false)
const reviewsError = ref<string | null>(null)

const fetchReviews = async (id: number) => {
  isReviewsLoading.value = true
  reviewsError.value = null
  try {
    const response = await $fetch<{ success: boolean; data: PaginatedMealReviewsResponse }>(
      `https://3b-meals.mh-home.net/meals/${id}/reviews?page=1&limit=50`,
    )
    if (response.success && response.data) {
      reviews.value = response.data.reviews
      emit('stats-updated', response.data.stats)
    }
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    reviewsError.value = 'Fehler beim Laden der Bewertungen'
  } finally {
    isReviewsLoading.value = false
  }
}

watch(() => props.mealId, (mealId) => {
  if (mealId && props.show) void fetchReviews(mealId)
})

watch(() => props.show, (show) => {
  if (show && props.mealId) void fetchReviews(props.mealId)
}, { immediate: true })
</script>

<style scoped>
.reviews-section-content {
  padding: 4px 4px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reviews-section-content.is-mobile {
  padding: 0 16px calc(32px + env(safe-area-inset-bottom, 0px));
}
</style>
