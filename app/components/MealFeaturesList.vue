<template>
  <div v-if="features && features.length" class="chip-list">
    <div
      v-for="feature in sortedFeatures"
      :key="feature.id"
      class="detail-chip feature-chip"
      :style="featureChipStyle(feature)"
    >
      <span v-if="getFeatureIconUrl(feature)" class="chip-leading feature-leading">
        <span class="feature-icon-mask" :style="featureMaskStyle(feature)"></span>
      </span>
      <span v-else class="chip-leading feature-leading text-fallback">{{ feature.shortName || '?' }}</span>
      <span class="chip-label">{{ feature.name || feature.shortName || 'Merkmal' }}</span>
    </div>
  </div>
  <p v-else class="empty-copy">Keine Merkmale angegeben.</p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MealFeature } from '~/types/meals'
import { getFeatureColor, getFeatureIconUrl } from '~/utils/mealFeatures'

const props = defineProps<{
  features: MealFeature[] | null | undefined
}>()

const sortedFeatures = computed(() => {
  if (!props.features) return []
  return [...props.features].sort((left, right) => {
    const leftOrder = left.orderInApp ?? Number.MAX_SAFE_INTEGER
    const rightOrder = right.orderInApp ?? Number.MAX_SAFE_INTEGER
    return leftOrder - rightOrder || left.id - right.id
  })
})

const featureChipStyle = (feature: MealFeature) => ({
  '--feature-chip-color': getFeatureColor(feature),
})

const featureMaskStyle = (feature: MealFeature) => ({
  backgroundColor: getFeatureColor(feature),
  maskImage: `url(${getFeatureIconUrl(feature)})`,
  webkitMaskImage: `url(${getFeatureIconUrl(feature)})`,
})
</script>

<style scoped>
.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.detail-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 8px 14px 8px 8px;
  border-radius: 999px;
}

.feature-chip {
  background: color-mix(in srgb, var(--feature-chip-color) 14%, var(--color-surface));
  color: var(--color-on-surface);
  border: 1px solid color-mix(in srgb, var(--feature-chip-color) 30%, transparent);
}

.chip-leading {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  flex-shrink: 0;
}

.feature-leading {
  background: rgba(255, 255, 255, 0.72);
}

.feature-icon-mask {
  width: 14px;
  height: 14px;
  display: inline-block;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
}

.text-fallback {
  font-size: 0.72rem;
  font-weight: 800;
}

.chip-label {
  font-size: 0.9rem;
  font-weight: 600;
}

.empty-copy {
  margin: 8px 0 0 0;
  color: var(--color-on-surface-variant);
}
</style>
