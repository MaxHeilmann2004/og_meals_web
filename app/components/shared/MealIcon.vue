<template>
  <div class="meal-icon-container" :class="{ 'on-image': onImage }" :title="featureName">
    <div
      v-if="iconUrl"
      class="meal-icon-mask"
      :style="maskStyle"
    ></div>
    <span v-else class="meal-text-badge">{{ featureName }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getFeatureColor, getFeatureIconUrl } from '~/utils/mealFeatures'

interface MealFeature {
  id: number
  name?: string | null
  shortName?: string | null
}

const props = withDefaults(
  defineProps<{
    feature: MealFeature
    /** When true, renders as a larger colored circle badge for overlay on meal images */
    onImage?: boolean
  }>(),
  { onImage: false }
)

const featureName = computed(() =>
  props.feature.name || props.feature.shortName || 'Unknown'
)

const iconUrl = computed(() => getFeatureIconUrl(props.feature))

const featureColor = computed(() => getFeatureColor(props.feature))

const maskStyle = computed(() => {
  if (!iconUrl.value) return {}
  return {
    backgroundColor: featureColor.value,
    maskImage: `url(${iconUrl.value})`,
    webkitMaskImage: `url(${iconUrl.value})`,
  }
})
</script>

<style scoped>
.meal-icon-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* ── Default (footer) mode: small icon ── */
.meal-icon-mask {
  width: 20px;
  height: 20px;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  display: inline-block;
  flex-shrink: 0;
}

.meal-text-badge {
  background-color: var(--color-secondary-container);
  color: var(--color-on-secondary-container);
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  white-space: nowrap;
}

/* ── On-image mode: larger colored circle badge ── */
.on-image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.on-image .meal-icon-mask {
  width: 18px;
  height: 18px;
}

.on-image .meal-text-badge {
  font-size: 0.625rem;
  padding: 1px 4px;
  border-radius: 3px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
}
</style>
