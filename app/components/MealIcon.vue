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

/** Colors matching the original Compose app's feature color scheme */
const FEATURE_COLORS: Record<number, string> = {
  11: '#4CAF50', // Vegan — green
  12: '#FF9800', // Glutenfrei — amber
  14: '#AB47BC', // Knoblauch — purple
  15: '#8D6E63', // Rind — brown
  16: '#EC407A', // Schwein — pink
  17: '#FF7043', // Geflügel — deep orange
  19: '#78909C', // Lamm — blue-grey
  25: '#66BB6A', // Vegetarisch — light green
  44: '#42A5F5', // Lactosefrei — blue
  45: '#6D4C41', // Wild — dark brown
  48: '#26C6DA', // Klimafreundlich — cyan
}

const featureName = computed(() =>
  props.feature.name || props.feature.shortName || 'Unknown'
)

const iconUrl = computed(() => {
  switch (Number(props.feature.id)) {
    case 11: return '/icons/ic_mf_vegan.svg'
    case 12: return '/icons/ic_mf_gluten_free.svg'
    case 14: return '/icons/ic_mf_garlic.svg'
    case 15: return '/icons/ic_mf_beef.svg'
    case 16: return '/icons/ic_mf_pork.svg'
    case 17: return '/icons/ic_mf_chicken.svg'
    case 19: return '/icons/ic_mf_lamb.svg'
    case 25: return '/icons/ic_mf_vegetarian.svg'
    case 44: return '/icons/ic_mf_lactose_free.svg'
    case 45: return '/icons/ic_mf_venison.svg'
    case 48: return '/icons/ic_mf_environment_friendly.svg'
    default: return null
  }
})

const featureColor = computed(() =>
  FEATURE_COLORS[Number(props.feature.id)] ?? 'var(--color-secondary)'
)

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
