<template>
  <div 
    ref="containerRef"
    class="carousel-container"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <div
      v-for="(image, index) in images"
      :key="image.url"
      class="carousel-item"
      :class="{
        'is-active': index === activeIndex,
        'is-pill': index !== activeIndex
      }"
      :style="{
        flex: getFlexForIndex(index),
        transition: isInteracting ? 'none' : 'flex 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
      }"
      @click="onItemClick($event, index)"
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
      <AiBadge
        v-if="image.aiSuggested"
        :absolute="true"
        :position="badgePosition"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface MealImageDto {
  url: string
  aiSuggested: boolean
}

const props = defineProps<{
  images: MealImageDto[]
  contentDescription: string
  badgePosition?: 'top-right' | 'bottom-right'
}>()

const badgePosition = computed(() => props.badgePosition ?? 'top-right')

const activeIndex = ref(0)
const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(0)

const CAROUSEL_GAP_PX = 8
const CAROUSEL_BORDER_RADIUS_PX = 28
const COLLAPSED_PILL_WIDTH_PX = 44

// Interaction states
const isInteracting = ref(false)
const liveProgress = ref(0) // Ranges from -1 to 1

// Touch gesture positions
let touchStartX = 0
let touchStartY = 0
let swipeAxis: 'x' | 'y' | null = null

const onTouchStart = (e: TouchEvent) => {
  if (!e.touches || !e.touches[0]) return
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  swipeAxis = null
  isInteracting.value = true
  liveProgress.value = 0
}

const onTouchMove = (e: TouchEvent) => {
  if (!isInteracting.value || !e.touches || !e.touches[0]) return

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

  if (swipeAxis === 'x') {
    if (e.cancelable) {
      e.preventDefault()
    }
    const maxDrag = 180 // Distance in pixels for a 100% transition
    let progress = diffX / maxDrag
    
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
let resizeObserver: ResizeObserver | null = null

const onWheel = (e: WheelEvent) => {
  // Only capture horizontal scrolling
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    e.preventDefault()
    isInteracting.value = true
    accumulatedDelta += e.deltaX

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
}

// Custom flex width calculations during active drag/swipe
const getBaseFlexValues = () => {
  const imageCount = props.images.length
  if (imageCount <= 1) {
    return { active: 1, pill: 1 }
  }

  const width = containerWidth.value
  if (width <= 0) {
    return { active: 7.5, pill: 1 }
  }

  const availableWidth = Math.max(width - CAROUSEL_GAP_PX * (imageCount - 1), 1)
  const pillWidth = Math.min(COLLAPSED_PILL_WIDTH_PX, availableWidth / imageCount)
  const activeWidth = Math.max(availableWidth - pillWidth * (imageCount - 1), pillWidth)

  return {
    active: activeWidth / pillWidth,
    pill: 1,
  }
}

const getFlexForIndex = (index: number) => {
  if (props.images.length <= 1) return 1

  const { active, pill } = getBaseFlexValues()
  const delta = active - pill

  const current = activeIndex.value
  const p = liveProgress.value

  if (p === 0) {
    return index === current ? active : pill
  }

  if (p > 0) {
    // Transitioning forward (next slide)
    const target = Math.min(current + 1, props.images.length - 1)
    if (target === current) {
      return index === current ? active : pill
    }

    if (index === current) {
      return active - p * delta
    }
    if (index === target) {
      return pill + p * delta
    }
    return pill
  } else {
    // Transitioning backward (previous slide)
    const target = Math.max(current - 1, 0)
    if (target === current) {
      return index === current ? active : pill
    }

    const absP = Math.abs(p)
    if (index === current) {
      return active - absP * delta
    }
    if (index === target) {
      return pill + absP * delta
    }
    return pill
  }
}

const onItemClick = (event: MouseEvent, index: number) => {
  if (isInteracting.value) {
    event.stopPropagation()
    return
  }

  if (index !== activeIndex.value) {
    event.stopPropagation()
    activeIndex.value = index
  }
}

onMounted(() => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth

    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      containerWidth.value = entry.contentRect.width
    })

    resizeObserver.observe(containerRef.value)
    containerRef.value.addEventListener('wheel', onWheel, { passive: false })
    containerRef.value.addEventListener('touchmove', onTouchMove, { passive: false })
  }
})

onUnmounted(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('wheel', onWheel)
    containerRef.value.removeEventListener('touchmove', onTouchMove)
  }

  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<style scoped>
.carousel-container,
.carousel-container * {
  touch-action: pan-y !important;
}

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
  overscroll-behavior-x: none;
}

.carousel-item {
  height: 100%;
  border-radius: 28px; /* Keep in sync with CAROUSEL_BORDER_RADIUS_PX in script */
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
/* Specific styling for inactive pill state */
:deep(.ai-badge) {
  pointer-events: none;
  transition: right 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@container (max-width: 60px) {
  :deep(.ai-badge) {
    right: calc(50% - 16px) !important; /* Center horizontally when container is narrow (pilled) */
  }
}
</style>
