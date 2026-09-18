<template>
  <div class="meal-media" :class="{ 'is-card': variant === 'card' }">
    <HorizontalCenteredHeroCarousel
      v-if="images.length > 1"
      :images="images"
      :content-description="contentDescription"
      :badge-position="badgePosition"
      :item-border-radius-px="itemBorderRadiusPx"
      :collapsed-pill-width-px="collapsedPillWidthPx"
    />
    <div v-else-if="images.length === 1" class="single-image-wrapper">
      <MealImage
        :meal-image="images[0]!"
        :content-description="contentDescription"
        :badge-position="badgePosition"
      />
    </div>
    <div v-else class="empty-image-placeholder">
      <img src="/meal_placeholder.png" alt="No image" class="placeholder-bg" />
      <div class="placeholder-overlay">
        <span>Kein Bild verfügbar</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MealImageDto } from '~/types/meals'

withDefaults(defineProps<{
  images: MealImageDto[]
  contentDescription: string
  variant?: 'card' | 'detail'
  badgePosition?: 'top-right' | 'bottom-right'
  itemBorderRadiusPx?: number
  collapsedPillWidthPx?: number
}>(), {
  variant: 'detail',
  badgePosition: 'top-right',
  itemBorderRadiusPx: 28,
})
</script>

<style scoped>
.meal-media {
  position: absolute;
  inset: 0;
}

.single-image-wrapper,
.empty-image-placeholder {
  position: absolute;
  inset: 0;
}

.meal-media.is-card .single-image-wrapper,
.meal-media.is-card .empty-image-placeholder {
  border-radius: 28px;
  overflow: hidden;
}

.meal-media.is-card .empty-image-placeholder {
  background-color: var(--color-surface-container-highest);
}

.placeholder-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(26, 17, 16, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-overlay span {
  color: var(--color-on-surface-variant);
  font-size: 0.875rem;
  font-weight: 500;
}

.meal-media.is-card :deep(.meal-image-wrapper) {
  border-radius: 28px;
}
</style>
