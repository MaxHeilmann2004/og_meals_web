<template>
  <div class="meal-icon-container">
    <div 
      v-if="iconUrl" 
      class="meal-icon-mask"
      :style="maskStyle"
      :title="featureName"
    ></div>
    <div v-else class="meal-text-badge">
      {{ featureName }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface MealFeature {
  id: number
  name?: string | null
  shortName?: string | null
}

const props = defineProps<{
  feature: MealFeature
}>()

const featureName = computed(() => {
  return props.feature.name || props.feature.shortName || 'Unknown'
})

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

const maskStyle = computed(() => {
  if (!iconUrl.value) return {}
  return {
    maskImage: `url(${iconUrl.value})`,
    webkitMaskImage: `url(${iconUrl.value})`
  }
})
</script>

<style scoped>
.meal-icon-container {
  display: inline-flex;
  align-items: center;
}

.meal-icon-mask {
  width: 16px;
  height: 16px;
  background-color: var(--color-secondary);
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  display: inline-block;
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
</style>
