<template>
  <div class="reviews-list-container">
    <div :class="{ 'reviews-list-body': !isMobile, 'is-mobile': isMobile }">
      <div v-if="isLoading" class="reviews-loading">
        <LoadingSpinner size="32px" label="Lade Bewertungen..." />
      </div>

      <div v-else-if="error" class="reviews-error-box">
        <p>{{ error }}</p>
        <var-button type="primary" size="small" @click="emit('retry')">Erneut versuchen</var-button>
      </div>

      <div v-else-if="reviews.length === 0" class="no-reviews-box">
        <p class="empty-copy">Noch keine Bewertungen vorhanden. Schreibe die erste!</p>
      </div>

      <div v-else class="reviews-cards-list">
        <MealReviewCard
          v-for="review in reviews"
          :key="review.id"
          :review="review"
          :is-mobile="isMobile"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MealReviewItem } from '~/types'
import MealReviewCard from './MealReviewCard.vue'

withDefaults(defineProps<{
  reviews: MealReviewItem[]
  isLoading: boolean
  error: string | null
  isMobile: boolean
}>(), {
  error: null,
})

const emit = defineEmits<{
  retry: []
}>()
</script>

<style scoped>
.reviews-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reviews-list-body {
  margin-top: 16px;
}

.reviews-loading,
.reviews-error-box,
.no-reviews-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px 16px;
  background: var(--color-surface-container-low);
  border-radius: 16px;
  border: 1px dashed var(--color-outline-variant);
}

.is-mobile .reviews-loading,
.is-mobile .reviews-error-box,
.is-mobile .no-reviews-box {
  background: var(--color-surface-container-high);
}

.reviews-loading p,
.reviews-error-box p,
.no-reviews-box p {
  margin: 0 0 12px 0;
  font-size: 0.95rem;
  color: var(--color-on-surface-variant);
}

.reviews-cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-copy {
  margin: 8px 0 0 0;
  color: var(--color-on-surface-variant);
}
</style>
