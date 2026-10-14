<template>
  <div class="reviews-section-content" :class="{ 'is-mobile': isMobile }">
    <div v-if="settingsError" class="review-settings-error" role="alert">
      <p>{{ settingsError }}</p>
      <var-button type="primary" size="small" :loading="isReviewsLoading" @click="fetchReviews(mealId)">
        Erneut versuchen
      </var-button>
    </div>

    <MealReviewForm
      :meal-id="mealId"
      :canteen="canteen"
      :weekday="weekday"
      :show="show"
      :is-mobile="isMobile"
      :text-reviews-enabled="textReviewsEnabled"
      :is-settings-loading="isSettingsLoading"
      @submitted="fetchReviews(mealId)"
    />

    <MealReviewList
      :reviews="reviews"
      :is-loading="isReviewsLoading"
      :error="reviewsError"
      :is-mobile="isMobile"
      :text-reviews-enabled="textReviewsEnabled === true"
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
  canteen: string
  weekday: string
  show: boolean
  isMobile: boolean
}>()

const emit = defineEmits<{
  'stats-updated': [stats: MealReviewStats]
}>()

const {
  reviews,
  isLoading: isReviewsLoading,
  error: reviewsError,
  textReviewsEnabled,
  isSettingsLoading,
  settingsError,
  fetchReviews,
} = useReviews(
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

.review-settings-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--color-error-container);
  color: var(--color-on-error-container);
}

.review-settings-error p {
  margin: 0;
  font-size: 0.875rem;
}
</style>
