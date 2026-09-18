import { computed, onUnmounted, ref, type Ref } from 'vue'

export const useBottomSheetDrag = (
  panelScrollRef: Ref<HTMLElement | null>,
  closeSheet: () => void,
) => {
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

  const resetSheetState = () => {
    dragOffset.value = 0
    isDragging.value = false
    isReturning.value = false
    hasDragged = false
  }

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    if (!touch) return

    touchActive = true
    touchStartY = touch.clientY
    touchLastY = touch.clientY
    touchStartTime = performance.now()
    hasDragged = false
    isDragging.value = event.target instanceof Element
      && event.target.closest('.sheet-handle-area') !== null
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
      const targetIsInScrollArea = event.target instanceof Node && panelScrollRef.value?.contains(event.target)
      const canStartSheetDrag = !targetIsInScrollArea || (panelScrollRef.value?.scrollTop ?? 0) <= 0
      if (deltaY <= 0 || !canStartSheetDrag) return

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
      dragOffset.value >= DISMISS_THRESHOLD_PX
      || (dragOffset.value > DRAG_START_THRESHOLD_PX && velocity >= DISMISS_VELOCITY_PX_PER_MS)
    )

    touchActive = false
    isDragging.value = false
    if (shouldDismiss) {
      closeSheet()
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
    if (hasDragged) {
      hasDragged = false
      return
    }
    closeSheet()
  }

  onUnmounted(resetReturnAnimation)

  return {
    dragOffset,
    isDragging,
    isReturning,
    sheetStyle,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
    onHandleClick,
    resetSheetState,
  }
}
