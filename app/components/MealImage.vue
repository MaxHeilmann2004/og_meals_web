<template>
  <div class="meal-image-wrapper">
    <!-- Main Image -->
    <img
      ref="imgRef"
      v-show="!isError"
      :src="fullImageUrl"
      :alt="contentDescription"
      class="meal-image"
      @load="onImageLoad"
      @error="onImageError"
    />

    <!-- Shimmer Loader -->
    <div v-if="isLoading && !isError" class="shimmer-placeholder"></div>

    <!-- Error State -->
    <div v-if="isError" class="error-placeholder">
      <span>Fehler beim Laden des Bildes</span>
    </div>

    <!-- AI Suggested Badge -->
    <div v-if="mealImage.aiSuggested && showAiBadge" class="ai-badge" title="AI suggested image">
      <img src="/ic_ai.svg" alt="AI Icon" class="ai-icon" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface MealImageDto {
  url: string
  aiSuggested: boolean
}

const props = withDefaults(
  defineProps<{
    mealImage: MealImageDto
    contentDescription: string
    showAiBadge?: boolean
  }>(),
  {
    showAiBadge: true
  }
)

const BASE_URL = 'https://3b-meals.mh-home.net'

const fullImageUrl = computed(() => {
  const url = props.mealImage.url
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `${BASE_URL}${url}`
})

const imgRef = ref<HTMLImageElement | null>(null)
const isLoading = ref(true)
const isError = ref(false)

const onImageLoad = () => {
  isLoading.value = false
}

const onImageError = () => {
  isLoading.value = false
  isError.value = true
}

onMounted(() => {
  if (imgRef.value && imgRef.value.complete) {
    if (imgRef.value.naturalWidth === 0) {
      onImageError()
    } else {
      onImageLoad()
    }
  }
})
</script>

<style scoped>
.meal-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: var(--color-surface-container-highest);
}

.meal-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Shimmer Keyframe Animation */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.shimmer-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-surface-container-highest) 25%,
    var(--color-outline-variant) 37%,
    var(--color-surface-container-highest) 63%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}

.error-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--color-tertiary-container);
  color: var(--color-on-tertiary-container);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 12px;
  text-align: center;
}

.ai-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.ai-icon {
  width: 18px;
  height: 18px;
  filter: brightness(0) invert(1); /* Ensure it renders white */
}
</style>
