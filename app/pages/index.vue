<template>
  <div class="page-container">
    <!-- Day Chips Navigation -->
    <div class="day-chips-scroll">
      <div class="day-chips-row">
        <var-chip
          v-for="(dayName, index) in dayNames"
          :key="index"
          class="day-chip"
          :class="{ 'is-selected': index === selectedDayIndex }"
          :plain="index !== selectedDayIndex"
          :round="false"
          type="primary"
          @click="selectedDayIndex = index"
        >
          {{ dayName }}
        </var-chip>
      </div>
    </div>

    <!-- Main List / Grid -->
    <div class="content-viewport">
      <!-- Initial Loading State (only when no data at all yet) -->
      <div v-if="pending && !data" class="loading-overlay">
        <LoadingSpinner size="72px" label="Lade Speiseplan..." />
      </div>

      <!-- Error State (shown as inline banner, doesn't remove content) -->
      <div v-if="error" class="error-banner">
        <span class="error-text">Fehler beim Laden: {{ error?.message }}</span>
        <var-button type="primary" size="small" @click="() => refresh()">Erneut versuchen</var-button>
      </div>

      <!-- Meals Content — always rendered once data exists, never torn down -->
      <div v-if="data" class="canteens-list">
        <div 
          v-for="canteen in filteredCanteens" 
          :key="canteen.id" 
          class="canteen-section"
        >
          <!-- Canteen Header -->
          <div class="canteen-header-row">
            <h2 class="canteen-header">{{ canteen.displayName || canteen.name }}</h2>
            <CanteenCapacityBadge
              :capacity="selectedDayIsToday ? capacityForCanteen(canteen.id) : null"
              :expected="selectedDayIsToday ? null : expectedCapacityForCanteen(canteen.id)"
              :is-today="selectedDayIsToday"
              :loading="selectedDayIsToday ? capacityPending : expectationPending"
              @click="openCapacityDetails(canteen)"
            />
          </div>

          <!-- Meals Grid -->
          <div class="meals-grid">
            <MealCard
              v-for="meal in canteen.mealsForSelectedDay"
              :key="meal.id"
              :meal="meal"
              :canteen="canteen"
              @select="openMealDetails(meal, canteen)"
            />
          </div>
        </div>

        <!-- No Meals State -->
        <div v-if="totalMealsForSelectedDay === 0 && !pending" class="no-meals-state">
          <p>Keine Gerichte für diesen Tag verfügbar.</p>
        </div>
      </div>
    </div>

    <ClientOnly>
      <MealDetailDialog
        :show="isMealDialogOpen"
        :meal="selectedMeal"
        :canteen="selectedMealCanteen"
        :is-mobile="isMobile"
        :is-admin="isAdmin"
        :admin-token="adminToken"
        @update:show="isMealDialogOpen = $event"
      />
      <CanteenCapacityDialog
        :show="isCapacityDialogOpen"
        :canteen="selectedCapacityCanteen"
        :current-capacity="selectedCapacityIsToday ? selectedCapacity : null"
        :expected-capacity="selectedExpectedCapacity"
        :selected-date="selectedCapacityDate"
        :is-today="selectedCapacityIsToday"
        :timeline="selectedCapacityTimeline"
        :timeline-loading="capacityTimelinePending"
        :timeline-error="capacityTimelineError"
        :is-mobile="isMobile"
        @update:show="isCapacityDialogOpen = $event"
        @retry="retryCapacityTimeline"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, inject } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import type {
  Canteen,
  CanteenCapacity,
  CanteenCapacityApiResponse,
  CanteenCapacityPredictionPoint,
  CanteenCapacityTimeline,
  CanteenCapacityTimelineApiResponse,
  Meal,
  MealsApiResponse,
} from '~/types/meals'
import {
  formatCalendarDate,
  getNearestPredictionPoint,
  getTodayCalendarDate,
} from '~/utils/canteenCapacity'
import { useFilterStore } from '~/stores/filters'
import { compareCanteens } from '~/utils/canteenOrder'
import { compareMealsByCategory } from '~/utils/mealOrder'
import { filterMealsForDay, type MealFilterOptions } from '~/utils/mealFiltering'
import { getInitialDayIndex, getWeekDates } from '~/utils/mealWeek'

const filterStore = useFilterStore()
const setLayoutCanteens = inject<(c: Pick<Canteen, 'id' | 'name' | 'displayName' | 'orderInApp'>[]) => void>('setLayoutCanteens')

const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']

const weekDates = getWeekDates()
const startOfWeekStr = formatCalendarDate(weekDates[0]!)
const endOfWeekStr = formatCalendarDate(weekDates[4]!)
const route = useRoute()

const adminToken = computed(() => {
  const rawToken = route.query.adminToken
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken
  return typeof token === 'string' ? token.trim() : ''
})

const isAdmin = computed(() => adminToken.value.length > 0)

const selectedDayIndex = ref(getInitialDayIndex())
const selectedDayDateStr = computed(() => formatCalendarDate(weekDates[selectedDayIndex.value]!))
const isMobile = useMediaQuery('(max-width: 767px)')
const isMealDialogOpen = ref(false)
const selectedMeal = ref<Meal | null>(null)
const selectedMealCanteen = ref<Canteen | null>(null)

const todayDate = getTodayCalendarDate()
const isCapacityDialogOpen = ref(false)
const selectedCapacityCanteen = ref<Canteen | null>(null)
const selectedCapacityDate = ref(todayDate)
const selectedCapacityTimeline = ref<CanteenCapacityTimeline | null>(null)
const capacityTimelinePending = ref(false)
const capacityTimelineError = ref<Error | null>(null)
const expectationPending = ref(false)
const capacityTimelineCache = new Map<string, CanteenCapacityTimeline>()
const capacityTimelineCacheTimes = new Map<string, number>()
const capacityTimelineVersion = ref(0)
let capacityTimelineRequestId = 0
let expectationRequestId = 0

// Server-side data fetch — pre-rendered and sent to the client
const { data, pending, error, refresh } = await useAsyncData<MealsApiResponse>(
  'meals-week',
  () => $fetch(`https://3b-meals.mh-home.net/meals?start=${startOfWeekStr}&end=${endOfWeekStr}`)
)

// Capacity is intentionally fetched separately so a capacity outage does not hide meals.
const {
  data: capacityData,
  pending: capacityPending,
} = await useAsyncData<CanteenCapacityApiResponse>(
  'canteen-capacity',
  () => $fetch('https://3b-meals.mh-home.net/capacity/current')
)

const capacityByCanteenId = computed(() => {
  const result = new Map<number, CanteenCapacity | null>()
  for (const entry of capacityData.value?.data ?? []) {
    result.set(entry.canteen.id, entry.capacity)
  }
  return result
})

const capacityForCanteen = (canteenId: number) => capacityByCanteenId.value.get(canteenId) ?? null
const selectedCapacity = computed(() => selectedCapacityCanteen.value
  ? capacityForCanteen(selectedCapacityCanteen.value.id)
  : null)

const rawCanteens = computed(() => {
  const canteens = data.value?.canteens ?? []
  return [...canteens].sort(compareCanteens)
})
const rawMeals = computed(() => data.value?.meals ?? [])
const selectedDayIsToday = computed(() => selectedDayDateStr.value === todayDate)
const selectedCapacityIsToday = computed(() => selectedCapacityDate.value === todayDate)

const expectedCapacityByCanteenId = computed(() => {
  // The cache is intentionally non-reactive; this version ref invalidates the computed map after requests finish.
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

// Sync canteen list to filter store and layout whenever data arrives
watch(rawCanteens, (canteens) => {
  filterStore.initFromCanteens(canteens)
  setLayoutCanteens?.(canteens.map(c => ({ id: c.id, name: c.name, displayName: c.displayName, orderInApp: c.orderInApp })))
}, { immediate: true })

const mealFilterOptions = computed<MealFilterOptions>(() => ({
  isSaladExcluded: filterStore.isSaladExcluded,
  excludedFeatureIds: new Set(
    Object.entries(filterStore.excludedFeatures)
      .filter(([, enabled]) => enabled)
      .map(([id]) => Number(id)),
  ),
  includedFeatureIds: Object.entries(filterStore.includedFeatures)
    .filter(([, enabled]) => enabled)
    .map(([id]) => Number(id)),
}))

// Group meals by canteen for the selected day, applying active filters.
const filteredCanteens = computed(() => rawCanteens.value
  .filter(c => filterStore.isCanteenEnabled(c.id))
  .map(c => {
    const mealsForSelectedDay = filterMealsForDay(
      rawMeals.value,
      c.id,
      selectedDayDateStr.value,
      mealFilterOptions.value,
    ).sort(compareMealsByCategory)
    return { ...c, mealsForSelectedDay }
  })
  .filter(c => c.mealsForSelectedDay.length > 0))

const totalMealsForSelectedDay = computed(() =>
  filteredCanteens.value.reduce((acc, c) => acc + c.mealsForSelectedDay.length, 0)
)

const openMealDetails = (meal: Meal, canteen: Canteen) => {
  selectedMeal.value = meal
  selectedMealCanteen.value = canteen
  isMealDialogOpen.value = true
}

const capacityTimelineKey = (canteenId: number, date: string) => `${canteenId}:${date}`

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
  await Promise.allSettled(canteens.map((canteen) => fetchCapacityTimeline(canteen, date)))
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

const scrollSelectedChipIntoView = (smooth = true) => {
  nextTick(() => {
    document.querySelector('.day-chip.is-selected')?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'nearest',
      inline: 'center',
    })
  })
}

watch([selectedDayDateStr, rawCanteens], ([date]) => {
  void preloadExpectations(date)
}, { immediate: true })

watch(selectedDayIndex, () => scrollSelectedChipIntoView(true))

watch(isMealDialogOpen, (isOpen) => {
  if (!isOpen) {
    selectedMeal.value = null
    selectedMealCanteen.value = null
  }
})

watch(isCapacityDialogOpen, (isOpen) => {
  if (!isOpen) {
    capacityTimelineRequestId++
    selectedCapacityCanteen.value = null
    selectedCapacityTimeline.value = null
    capacityTimelineError.value = null
    capacityTimelinePending.value = false
  }
})

onMounted(() => scrollSelectedChipIntoView(false))
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* Day Chips styles */
.day-chips-scroll {
  width: 100%;
  overflow-x: auto;
  background-color: var(--color-surface);
  padding: 8px 16px;
  box-sizing: border-box;
  scrollbar-width: none; /* Hide scrollbars for cleaner layout */
}

.day-chips-scroll::-webkit-scrollbar {
  display: none;
}

.day-chips-row {
  display: flex;
  gap: 8px;
  min-width: max-content;
  justify-content: flex-start;
}

@media (min-width: 768px) {
  .day-chips-row {
    justify-content: center;
    min-width: 100%;
  }
}


.day-chip {
  cursor: pointer;
  user-select: none;
}

.day-chip.is-selected {
  font-weight: 700;
}

.content-viewport {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 48px;
}

.error-banner {
  margin: 24px;
  padding: 16px;
  background-color: var(--color-error-container);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.error-text {
  color: var(--color-on-error-container);
  font-weight: 500;
}

.canteens-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1300px;
  margin: 0 auto;
  padding: 8px 16px 24px;
  box-sizing: border-box;
}

.canteen-section {
  display: flex;
  flex-direction: column;
  margin-top: 12px;
}

.canteen-header-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  min-width: 0;
  margin: 12px 12px 16px;
}

.canteen-header {
  min-width: 0;
  flex: 0 1 auto;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-on-surface);
  line-height: 1.2;
}

/* Responsive grid layout */
.meals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
  width: 100%;
}

@media (max-width: 767px) {
  .meals-grid {
    grid-template-columns: 1fr;
  }
  .canteens-list {
    padding: 8px 4px 24px;
  }
  .canteen-header-row {
    align-items: center;
    flex-wrap: wrap;
    margin: 8px 4px 12px;
  }

  .canteen-header {
    font-size: 1.25rem;
  }
}

.no-meals-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 48px;
  color: var(--color-text-muted);
  font-weight: 500;
}
</style>
