<template>
  <article class="review-card" :class="{ 'is-mobile': isMobile }">
    <div class="review-card-header">
      <var-rate
        readonly
        :model-value="review.star"
        size="18"
        color="var(--color-primary)"
        empty-color="var(--color-outline-variant)"
      />
      <span class="review-card-date">{{ formatRelativeDate(review.createdAt) }}</span>
    </div>
    <p class="review-card-comment">{{ review.comment }}</p>
    <span v-if="!review.isFromOriginalMeal && review.matchType === 'similarity'" class="propagated-tag">
      <AiBadge :inline="true" />
      Ähnliches Gericht
    </span>
  </article>
</template>

<script setup lang="ts">
import type { MealReviewItem } from '~/types'
import { formatRelativeDate } from '~/utils/meal/formatters'

defineProps<{
  review: MealReviewItem
  isMobile: boolean
}>()
</script>

<style scoped>
.review-card {
  background: var(--color-surface-container-low);
  border-radius: 20px;
  padding: 16px;
  border: 1px solid var(--color-outline-variant);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.is-mobile .review-card {
  box-shadow: none;
  border-radius: 16px;
  background: var(--color-surface-container-high);
}

.review-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.review-card-header :deep(.var-rate__content) {
  cursor: default !important;
  padding: 0 1px !important;
  background: transparent !important;
}

.review-card-header :deep(.var-rate__content .var-hover-overlay),
.review-card-header :deep(.var-rate__content .var-ripple) {
  display: none !important;
}

.review-card-date {
  font-size: 0.8rem;
  color: var(--color-on-surface-variant);
  opacity: 0.75;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: 8px;
}

.review-card-comment {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--color-on-surface);
  word-break: break-word;
  white-space: pre-wrap;
}

.propagated-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  padding: 2px 8px;
  border-radius: 99px;
  align-self: flex-start;
  font-weight: 600;
}
</style>
