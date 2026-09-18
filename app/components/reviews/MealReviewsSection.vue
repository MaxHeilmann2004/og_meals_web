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
import { toRef } from 'vue'
import type { MealReviewStats } from '~/types'
import { useReviews } from '~/composables/useReviews'
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

const { reviews, isLoading: isReviewsLoading, error: reviewsError, fetchReviews } = useReviews(
  toRef(props, 'mealId'),
  toRef(props, 'show'),
  stats => emit('stats-updated', stats),
)
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
