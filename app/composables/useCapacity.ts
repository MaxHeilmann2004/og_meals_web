import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import type {
  Canteen,
  CanteenCapacity,
  CanteenCapacityApiResponse,
  CanteenCapacityPredictionPoint,
  CanteenCapacityTimeline,
  CanteenCapacityTimelineApiResponse,
} from '~/types'
import {
  getNearestPredictionPoint,
} from '~/utils/canteenCapacity'

export const useCapacity = (
  rawCanteens: ComputedRef<Canteen[]>,
  selectedDayDateStr: ComputedRef<string>,
  todayDate: string,
  capacityData: Ref<CanteenCapacityApiResponse | null | undefined>,
  capacityPending: Ref<boolean>,
) => {
  const capacityByCanteenId = computed(() => {
    const result = new Map<number, CanteenCapacity | null>()
    for (const entry of capacityData.value?.data ?? []) {
      result.set(entry.canteen.id, entry.capacity)
    }
    return result
  })

  const capacityForCanteen = (canteenId: number) => capacityByCanteenId.value.get(canteenId) ?? null
  const selectedCapacityCanteen = ref<Canteen | null>(null)
  const selectedCapacityDate = ref(todayDate)
  const selectedCapacityTimeline = ref<CanteenCapacityTimeline | null>(null)
  const selectedCapacity = computed(() => selectedCapacityCanteen.value
    ? capacityForCanteen(selectedCapacityCanteen.value.id)
    : null)
  const selectedDayIsToday = computed(() => selectedDayDateStr.value === todayDate)
  const selectedCapacityIsToday = computed(() => selectedCapacityDate.value === todayDate)

  const expectationPending = ref(false)
  const capacityTimelinePending = ref(false)
  const capacityTimelineError = ref<Error | null>(null)
  const isCapacityDialogOpen = ref(false)
  const capacityTimelineCache = new Map<string, CanteenCapacityTimeline>()
  const capacityTimelineCacheTimes = new Map<string, number>()
  const capacityTimelineVersion = ref(0)
  let capacityTimelineRequestId = 0
  let expectationRequestId = 0

  const capacityTimelineKey = (canteenId: number, date: string) => `${canteenId}:${date}`

  const expectedCapacityByCanteenId = computed(() => {
    capacityTimelineVersion.value
    const result = new Map<number, CanteenCapacityPredictionPoint | null>()
    if (selectedDayIsToday.value) return result

    for (const canteen of rawCanteens.value) {
      const timeline = capacityTimelineCache.get(capacityTimelineKey(canteen.id, selectedDayDateStr.value))
      result.set(
        canteen.id,
        timeline?.prediction ? getNearestPredictionPoint(selectedDayDateStr.value, timeline.prediction.points) : null,
      )
    }
    return result
  })

  const expectedCapacityForCanteen = (canteenId: number) => expectedCapacityByCanteenId.value.get(canteenId) ?? null
  const selectedExpectedCapacity = computed(() => {
    if (selectedCapacityIsToday.value || !selectedCapacityTimeline.value?.prediction) return null
    return getNearestPredictionPoint(selectedCapacityDate.value, selectedCapacityTimeline.value.prediction.points)
  })

  const fetchCapacityTimeline = async (canteen: Canteen, date: string, force = false) => {
    const key = capacityTimelineKey(canteen.id, date)
    const cachedAt = capacityTimelineCacheTimes.get(key) ?? 0
    const cached = capacityTimelineCache.get(key)
    if (!force && cached && Date.now() - cachedAt < 5 * 60 * 1000) {
      capacityTimelineVersion.value++
      return cached
    }

    const response = await $fetch<CanteenCapacityTimelineApiResponse>(
      `https://3b-meals.mh-home.net/capacity/timeline?canteenId=${canteen.id}&date=${date}`,
    )
    capacityTimelineCache.set(key, response.data)
    capacityTimelineCacheTimes.set(key, Date.now())
    capacityTimelineVersion.value++
    return response.data
  }

  const preloadExpectations = async (date: string) => {
    const requestId = ++expectationRequestId
    const canteens = rawCanteens.value
    if (date === todayDate || canteens.length === 0) {
      expectationPending.value = false
      return
    }

    expectationPending.value = true
    await Promise.allSettled(canteens.map(canteen => fetchCapacityTimeline(canteen, date)))
    if (requestId === expectationRequestId) expectationPending.value = false
  }

  const loadCapacityTimeline = async (canteen: Canteen, date: string, force = false) => {
    const requestId = ++capacityTimelineRequestId
    capacityTimelinePending.value = true
    capacityTimelineError.value = null
    try {
      selectedCapacityTimeline.value = await fetchCapacityTimeline(canteen, date, force)
    } catch (error) {
      if (requestId !== capacityTimelineRequestId) return
      capacityTimelineError.value = error instanceof Error
        ? error
        : new Error('Der Auslastungsverlauf konnte nicht geladen werden.')
      selectedCapacityTimeline.value = null
    } finally {
      if (requestId === capacityTimelineRequestId) capacityTimelinePending.value = false
    }
  }

  const openCapacityDetails = (canteen: Canteen) => {
    selectedCapacityCanteen.value = canteen
    selectedCapacityDate.value = selectedDayDateStr.value
    selectedCapacityTimeline.value = null
    capacityTimelineError.value = null
    isCapacityDialogOpen.value = true
    void loadCapacityTimeline(canteen, selectedCapacityDate.value)
  }

  const retryCapacityTimeline = () => {
    if (!selectedCapacityCanteen.value) return
    void loadCapacityTimeline(selectedCapacityCanteen.value, selectedCapacityDate.value, true)
  }

  watch([selectedDayDateStr, rawCanteens], ([date]) => {
    void preloadExpectations(date)
  }, { immediate: true })

  watch(isCapacityDialogOpen, (isOpen) => {
    if (isOpen) return
    capacityTimelineRequestId++
    selectedCapacityCanteen.value = null
    selectedCapacityTimeline.value = null
    capacityTimelineError.value = null
    capacityTimelinePending.value = false
  })

  return {
    capacityForCanteen,
    capacityPending,
    selectedCapacity,
    selectedCapacityCanteen,
    selectedCapacityDate,
    selectedCapacityIsToday,
    selectedCapacityTimeline,
    selectedDayIsToday,
    selectedExpectedCapacity,
    expectedCapacityForCanteen,
    expectationPending,
    isCapacityDialogOpen,
    capacityTimelinePending,
    capacityTimelineError,
    openCapacityDetails,
    retryCapacityTimeline,
  }
}
