<template>
  <div 
    ref="containerRef"
    class="carousel-container"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <div
      v-for="(image, index) in images"
      :key="index"
      class="carousel-item"
      :class="{
        'is-active': index === activeIndex,
        'is-pill': index !== activeIndex
      }"
      :style="{
        flex: getFlexForIndex(index),
        transition: isInteracting ? 'none' : 'flex 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
      }"
      @click="onItemClick(index)"
    >
      <div class="carousel-img-wrapper">
        <MealImage
          :meal-image="image"
          :content-description="`${contentDescription} - Bild ${index + 1}`"
          class="carousel-img"
          :show-ai-badge="false"
        />
      </div>
      <!-- AI Suggested Badge placed relative to the clipping mask container -->
      <div v-if="image.aiSuggested" class="ai-badge" title="AI suggested image">
        <img src="/ic_ai.svg" alt="AI Icon" class="ai-icon" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface MealImageDto {
  url: string
  aiSuggested: boolean
}

const props = defineProps<{
  images: MealImageDto[]
  contentDescription: string
}>()

const activeIndex = ref(0)
const containerRef = ref<HTMLElement | null>(null)

// Interaction states
const isInteracting = ref(false)
const liveProgress = ref(0) // Ranges from -1 to 1

// Touch gesture positions
let touchStartX = 0
let touchStartY = 0
let swipeAxis: 'x' | 'y' | null = null

const onTouchStart = (e: TouchEvent) => {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  swipeAxis = null
  isInteracting.value = true
  liveProgress.value = 0
}

const onTouchMove = (e: TouchEvent) => {
  if (!isInteracting.value) return

  const currentX = e.touches[0].clientX
  const currentY = e.touches[0].clientY
  const diffX = touchStartX - currentX
  const diffY = touchStartY - currentY

  // Establish swipe axis on initial movement threshold
  if (!swipeAxis) {
    if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
      swipeAxis = Math.abs(diffX) > Math.abs(diffY) ? 'x' : 'y'
    }
  }

  if (swipeAxis) {
    // Only block page scroll if swiping
    if (e.cancelable) {
      e.preventDefault()
    }
    const delta = swipeAxis === 'x' ? diffX : diffY
    const maxDrag = 180 // Distance in pixels for a 100% transition
    let progress = delta / maxDrag
    
    // Clamp progress
    if (progress > 1) progress = 1
    if (progress < -1) progress = -1
    
    liveProgress.value = progress
  }
}

const onTouchEnd = () => {
  if (!isInteracting.value) return
  isInteracting.value = false

  const p = liveProgress.value
  if (Math.abs(p) > 0.25) {
    if (p > 0) {
      activeIndex.value = Math.min(activeIndex.value + 1, props.images.length - 1)
    } else {
      activeIndex.value = Math.max(activeIndex.value - 1, 0)
    }
  }

  liveProgress.value = 0
}

// Trackpad/Mouse Wheel scrolling state
let accumulatedDelta = 0
let wheelTimeout: ReturnType<typeof setTimeout> | null = null

const onWheel = (e: WheelEvent) => {
  e.preventDefault()

  isInteracting.value = true

  // Capture delta along dominant scroll direction
  const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
  accumulatedDelta += delta

  const maxWheel = 150 // Scroll distance unit for a 100% transition
  let progress = accumulatedDelta / maxWheel

  // Clamp progress
  if (progress > 1) progress = 1
  if (progress < -1) progress = -1

  liveProgress.value = progress

  if (wheelTimeout) {
    clearTimeout(wheelTimeout)
  }

  wheelTimeout = setTimeout(() => {
    // Finished wheeling gesture
    isInteracting.value = false

    const p = liveProgress.value
    if (Math.abs(p) > 0.25) {
      if (p > 0) {
        activeIndex.value = Math.min(activeIndex.value + 1, props.images.length - 1)
      } else {
        activeIndex.value = Math.max(activeIndex.value - 1, 0)
      }
    }

    liveProgress.value = 0
    accumulatedDelta = 0
  }, 150)
}

// Custom flex width calculations during active drag/swipe
const getFlexForIndex = (index: number) => {
  if (props.images.length <= 1) return 1

  const current = activeIndex.value
  const p = liveProgress.value

  if (p === 0) {
    return index === current ? 7.5 : 1
  }

  if (p > 0) {
    // Transitioning forward (next slide)
    const target = Math.min(current + 1, props.images.length - 1)
    if (target === current) {
      return index === current ? 7.5 : 1
    }

    if (index === current) {
      return 7.5 - p * 6.5
    }
    if (index === target) {
      return 1.0 + p * 6.5
    }
    return 1
  } else {
    // Transitioning backward (previous slide)
    const target = Math.max(current - 1, 0)
    if (target === current) {
      return index === current ? 7.5 : 1
    }

    const absP = Math.abs(p)
    if (index === current) {
      return 7.5 - absP * 6.5
    }
    if (index === target) {
      return 1.0 + absP * 6.5
    }
    return 1
  }
}

const onItemClick = (index: number) => {
  if (!isInteracting.value) {
    activeIndex.value = index
  }
}

onMounted(() => {
  if (containerRef.value) {
    containerRef.value.addEventListener('wheel', onWheel, { passive: false })
    containerRef.value.addEventListener('touchmove', onTouchMove, { passive: false })
  }
})

onUnmounted(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('wheel', onWheel)
    containerRef.value.removeEventListener('touchmove', onTouchMove)
  }
})
</script>

<style scoped>
.carousel-container {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  width: 100%;
  height: 100%;
  gap: 8px;
  overflow: hidden;
  user-select: none;
  touch-action: none; /* Prevents vertical scrolling defaults while swiping inside the container */
}

.carousel-item {
  height: 100%;
  border-radius: 28px; /* Material 3 extraLarge / pill radius */
  overflow: hidden;
  cursor: pointer;
  position: relative;
  will-change: flex;
  display: flex;
  justify-content: center;
  align-items: center;
  container-type: inline-size; /* Enables container queries for children */
}

.carousel-img-wrapper {
  height: 100%;
  aspect-ratio: 16 / 9;
  flex-shrink: 0;
}

.carousel-img {
  width: 100%;
  height: 100%;
  pointer-events: none; /* Prevent browser drag behaviors */
}

/* Specific styling for inactive pill state */
.carousel-item:not(.is-active) :deep(.meal-image) {
  opacity: 0.8;
  filter: brightness(0.85) contrast(0.9);
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
  pointer-events: none;
  transition: right 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@container (max-width: 60px) {
  .ai-badge {
    right: calc(50% - 16px) !important; /* Center horizontally when container is narrow (pilled) */
  }
}

.ai-icon {
  width: 18px;
  height: 18px;
  filter: brightness(0) invert(1);
}
</style>
