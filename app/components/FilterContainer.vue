<template>
  <!--
    All three modes are Teleported to <body> so nothing inside this
    component ever participates in the page layout flow.
    Desktop: position:fixed panel (no layout shift, stays in viewport while scrolling)
    Tablet:  centered dialog with backdrop
    Mobile:  bottom sheet with backdrop
  -->
  <Teleport to="body">
    <!-- Backdrop for sheet + dialog -->
    <Transition name="backdrop-fade">
      <div
        v-if="isFilterOpen && mode !== 'side'"
        class="filter-backdrop"
        @click="filterStore.closeFilters()"
      ></div>
    </Transition>

    <!-- ── Mobile Bottom Sheet (<768px) ── -->
    <Transition name="slide-up">
      <div
        v-if="isFilterOpen && mode === 'sheet'"
        ref="sheetRef"
        class="filter-bottom-sheet"
        :class="{
          'is-dragging': isDragging,
          'is-returning': isReturning,
        }"
        :style="sheetStyle"
        @touchstart.capture="onTouchStart"
        @touchmove.capture="onTouchMove"
        @touchend.capture="onTouchEnd"
        @touchcancel.capture="onTouchCancel"
      >
        <div class="sheet-handle-area" @click="onHandleClick">
          <div class="sheet-handle"></div>
        </div>
        <div class="panel-header">
          <h2 class="panel-title">Filter</h2>
          <button class="close-btn" aria-label="Filter schließen" @click="filterStore.closeFilters()">✕</button>
        </div>
        <div ref="panelScrollRef" class="panel-scroll">
          <FilterPanel :canteens="canteens" />
        </div>
      </div>
    </Transition>

    <!-- ── Dialog (>=768px, until there is enough room for a non-overlapping side panel) ── -->
    <Transition name="dialog-pop">
      <div v-if="isFilterOpen && mode === 'dialog'" class="filter-dialog">
        <div class="panel-header">
          <h2 class="panel-title">Filter</h2>
          <button class="close-btn" aria-label="Filter schließen" @click="filterStore.closeFilters()">✕</button>
        </div>
        <div class="panel-scroll">
          <FilterPanel :canteens="canteens" />
        </div>
      </div>
    </Transition>

    <!-- ── Desktop Side Panel (only on very wide viewports) ── -->
    <!--
      position:fixed — completely out of document flow, so the meals
      layout never shifts. Stays anchored to the viewport while scrolling.
      Internal overflow-y:auto handles tall filter content.
    -->
    <Transition name="slide-in">
      <aside v-if="isFilterOpen && mode === 'side'" class="filter-side-panel">
        <div class="panel-header">
          <h2 class="panel-title">Filter</h2>
          <button class="close-btn" aria-label="Filter schließen" @click="filterStore.closeFilters()">✕</button>
        </div>
        <div class="panel-scroll">
          <FilterPanel :canteens="canteens" />
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useFilterStore } from '~/stores/filters'

interface Canteen {
  id: number
  name: string
  displayName: string
  orderInApp: number
}

defineProps<{ canteens: Canteen[] }>()

const filterStore = useFilterStore()
const { width } = useWindowSize()
const isFilterOpen = computed(() => filterStore.isFilterOpen)

const panelScrollRef = ref<HTMLElement | null>(null)
const dragOffset = ref(0)
const isDragging = ref(false)
const isReturning = ref(false)
const sheetStyle = computed(() => ({
  '--sheet-drag-offset': `${dragOffset.value}px`,
}))

let touchActive = false
let touchStartY = 0
let touchLastY = 0
let touchStartTime = 0
let hasDragged = false
let returnAnimationTimeout: ReturnType<typeof setTimeout> | null = null

const DRAG_START_THRESHOLD_PX = 4
const DISMISS_THRESHOLD_PX = 100
const DISMISS_VELOCITY_PX_PER_MS = 0.6

const resetReturnAnimation = () => {
  if (returnAnimationTimeout) {
    clearTimeout(returnAnimationTimeout)
    returnAnimationTimeout = null
  }
}

const onTouchStart = (event: TouchEvent) => {
  const touch = event.touches[0]
  if (!touch) return

  touchActive = true
  touchStartY = touch.clientY
  touchLastY = touch.clientY
  touchStartTime = performance.now()
  hasDragged = false
  const startsOnHandle = event.target instanceof Element && event.target.closest('.sheet-handle-area') !== null
  isDragging.value = startsOnHandle
  isReturning.value = false
  resetReturnAnimation()
}

const onTouchMove = (event: TouchEvent) => {
  if (!touchActive) return
  const touch = event.touches[0]
  if (!touch) return

  const deltaY = touch.clientY - touchStartY

  if (!isDragging.value) {
    if (Math.abs(deltaY) <= DRAG_START_THRESHOLD_PX) return

    hasDragged = true
    const targetIsInScrollArea =
      event.target instanceof Node && panelScrollRef.value?.contains(event.target)
    const canStartSheetDrag =
      !targetIsInScrollArea || (panelScrollRef.value?.scrollTop ?? 0) <= 0

    // Let the scroll container handle upward movement and downward movement
    // while it still has content above the viewport.
    if (deltaY <= 0 || !canStartSheetDrag) return

    // Transfer the gesture to the sheet without including the distance used
    // to scroll the filter list back to its top edge.
    touchStartY = touch.clientY
    touchLastY = touch.clientY
    touchStartTime = performance.now()
    dragOffset.value = 0
    isDragging.value = true
  }

  const positiveDeltaY = Math.max(0, touch.clientY - touchStartY)
  if (positiveDeltaY > DRAG_START_THRESHOLD_PX) hasDragged = true

  dragOffset.value = positiveDeltaY
  touchLastY = touch.clientY
  if (event.cancelable) event.preventDefault()
}

const finishTouchGesture = (event: TouchEvent | null, allowDismiss = true) => {
  if (!touchActive) return

  const touch = event?.changedTouches[0]
  if (touch && isDragging.value) {
    dragOffset.value = Math.max(0, touch.clientY - touchStartY)
    touchLastY = touch.clientY
  }

  const elapsed = Math.max(performance.now() - touchStartTime, 1)
  const velocity = (touchLastY - touchStartY) / elapsed
  const shouldDismiss = allowDismiss && (
    dragOffset.value >= DISMISS_THRESHOLD_PX ||
    (dragOffset.value > DRAG_START_THRESHOLD_PX && velocity >= DISMISS_VELOCITY_PX_PER_MS)
  )

  touchActive = false
  isDragging.value = false

  if (shouldDismiss) {
    // Keep the current offset while Vue applies the leave transition. The
    // transition then carries the sheet the rest of the way off-screen.
    filterStore.closeFilters()
    return
  }

  isReturning.value = dragOffset.value > 0
  dragOffset.value = 0
  if (isReturning.value) {
    resetReturnAnimation()
    returnAnimationTimeout = setTimeout(() => {
      isReturning.value = false
      returnAnimationTimeout = null
    }, 250)
  }
}

const onTouchEnd = (event: TouchEvent) => finishTouchGesture(event)
const onTouchCancel = (event: TouchEvent) => finishTouchGesture(event, false)

const onHandleClick = () => {
  // A pointer drag also produces a click on some mobile browsers; do not
  // close a sheet that was merely dragged back into place.
  if (hasDragged) {
    hasDragged = false
    return
  }
  filterStore.closeFilters()
}

onUnmounted(() => {
  resetReturnAnimation()
  unlockBodyScroll()
})

const MOBILE_BREAKPOINT_PX = 768
const MEALS_CONTENT_MAX_WIDTH_PX = 1300
const SIDE_PANEL_WIDTH_PX = 320
const SIDE_PANEL_RIGHT_OFFSET_PX = 24
const CONTENT_TO_PANEL_GAP_PX = 16

// Keep side mode only when the centered meals content can stay fully visible
// without being covered by the fixed panel on the right.
const SIDE_MODE_MIN_VIEWPORT_WIDTH_PX =
  MEALS_CONTENT_MAX_WIDTH_PX +
  2 * (SIDE_PANEL_WIDTH_PX + SIDE_PANEL_RIGHT_OFFSET_PX + CONTENT_TO_PANEL_GAP_PX)

const mode = computed<'sheet' | 'dialog' | 'side'>(() => {
  if (width.value < MOBILE_BREAKPOINT_PX) return 'sheet'
  if (width.value < SIDE_MODE_MIN_VIEWPORT_WIDTH_PX) return 'dialog'
  return 'side'
})

interface BodyScrollLockState {
  bodyOverflow: string
  bodyPaddingRight: string
  bodyOverscrollBehavior: string
  htmlOverflow: string
  htmlOverscrollBehavior: string
}

let bodyScrollLockState: BodyScrollLockState | null = null

const lockBodyScroll = () => {
  if (typeof document === 'undefined' || bodyScrollLockState) return

  const body = document.body
  const html = document.documentElement
  bodyScrollLockState = {
    bodyOverflow: body.style.overflow,
    bodyPaddingRight: body.style.paddingRight,
    bodyOverscrollBehavior: body.style.overscrollBehavior,
    htmlOverflow: html.style.overflow,
    htmlOverscrollBehavior: html.style.overscrollBehavior,
  }

  const scrollbarWidth = window.innerWidth - html.clientWidth
  body.style.overflow = 'hidden'
  body.style.overscrollBehavior = 'none'
  if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`
  html.style.overflow = 'hidden'
  html.style.overscrollBehavior = 'none'
}

const unlockBodyScroll = () => {
  if (typeof document === 'undefined' || !bodyScrollLockState) return

  const body = document.body
  const html = document.documentElement
  const savedState = bodyScrollLockState
  bodyScrollLockState = null

  body.style.overflow = savedState.bodyOverflow
  body.style.paddingRight = savedState.bodyPaddingRight
  body.style.overscrollBehavior = savedState.bodyOverscrollBehavior
  html.style.overflow = savedState.htmlOverflow
  html.style.overscrollBehavior = savedState.htmlOverscrollBehavior
}

// A dismissed sheet keeps its drag offset until the leave transition finishes.
// Clear it before the next opening so a newly rendered sheet starts at its base position.
watch([isFilterOpen, mode], ([isOpen, currentMode]) => {
  if (isOpen && currentMode !== 'side') lockBodyScroll()
  else unlockBodyScroll()

  if (!isOpen || currentMode !== 'sheet') return

  dragOffset.value = 0
  isDragging.value = false
  isReturning.value = false
  hasDragged = false
}, { immediate: true })

onMounted(() => {
  if (isFilterOpen.value && mode.value !== 'side') lockBodyScroll()
})
</script>

<style scoped>
/* ── Backdrop ── */
.filter-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  z-index: 200;
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active { transition: opacity 0.3s ease; }
.backdrop-fade-enter-from,
.backdrop-fade-leave-to { opacity: 0; }

/* ── Shared elements ── */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 8px;
  flex-shrink: 0;
}

.panel-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-on-surface);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-on-surface);
  font-size: 1rem;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
  font-family: inherit;
}
.close-btn:hover { background-color: var(--color-surface-container-high); }

.panel-scroll {
  overflow-y: auto;
  flex: 1;
  touch-action: pan-y;
  overscroll-behavior: contain;
}

/* ── Mobile Bottom Sheet ── */
.filter-bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 85vh;
  background-color: var(--color-surface-container);
  border-radius: 28px 28px 0 0;
  z-index: 210;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.18);
  transform: translateY(var(--sheet-drag-offset, 0px));
}

.filter-bottom-sheet.is-dragging {
  transition: none;
}

.filter-bottom-sheet.is-returning {
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.sheet-handle-area {
  display: flex;
  justify-content: center;
  padding: 12px 0 0;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.sheet-handle-area:active {
  cursor: grabbing;
}

.sheet-handle {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background-color: var(--color-outline-variant);
}

.slide-up-enter-active { transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
.slide-up-leave-active { transition: transform 0.25s cubic-bezier(0.55, 0, 1, 0.45); }
.slide-up-enter-from,
.slide-up-leave-to { transform: translateY(100%); }

/* ── Tablet Dialog ── */
.filter-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(480px, calc(100vw - 48px));
  max-height: 80vh;
  background-color: var(--color-surface-container);
  border: 1px solid var(--color-outline-variant);
  border-radius: 28px;
  z-index: 210;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.dialog-pop-enter-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.dialog-pop-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.dialog-pop-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.92);
}
.dialog-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.95);
}

/* ── Desktop Side Panel ──
   position:fixed means:
   • Completely removed from document flow → no layout shift when opening
   • Always anchored to viewport → stays visible as the user scrolls the page
   • right/top anchored below the sticky header
*/
.filter-side-panel {
  position: fixed;
  top: 80px;   /* 64px header + 16px breathing room */
  right: 24px;
  width: 320px;
  max-height: calc(100vh - 96px);
  /* M3 Card appearance */
  background-color: var(--color-surface-container-low);
  border: 1px solid var(--color-outline-variant);
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  z-index: 50;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.slide-in-enter-active {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease;
}
.slide-in-leave-active {
  transition: transform 0.22s ease, opacity 0.2s ease;
}
.slide-in-enter-from { transform: translateX(24px); opacity: 0; }
.slide-in-leave-to   { transform: translateX(24px); opacity: 0; }
</style>
