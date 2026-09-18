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
  CanteenCapacityApiResponse,
  Meal,
  MealsApiResponse,
} from '~/types'
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
import { useAdminAccess } from '~/composables/useAdminAccess'
import { useCapacity } from '~/composables/useCapacity'

const filterStore = useFilterStore()
const setLayoutCanteens = inject<(c: Pick<Canteen, 'id' | 'name' | 'displayName' | 'orderInApp'>[]) => void>('setLayoutCanteens')

const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']

const weekDates = getWeekDates()
const startOfWeekStr = formatCalendarDate(weekDates[0]!)
const endOfWeekStr = formatCalendarDate(weekDates[4]!)
const { adminToken, isAdmin } = useAdminAccess()

const selectedDayIndex = ref(getInitialDayIndex())
const selectedDayDateStr = computed(() => formatCalendarDate(weekDates[selectedDayIndex.value]!))
const isMobile = useMediaQuery('(max-width: 767px)')
const isMealDialogOpen = ref(false)
const selectedMeal = ref<Meal | null>(null)
const selectedMealCanteen = ref<Canteen | null>(null)

const todayDate = getTodayCalendarDate()

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

const rawCanteens = computed(() => {
  const canteens = data.value?.canteens ?? []
  return [...canteens].sort(compareCanteens)
})
const rawMeals = computed(() => data.value?.meals ?? [])

const {
  capacityForCanteen,
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
} = useCapacity(rawCanteens, selectedDayDateStr, todayDate, capacityData, capacityPending)

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

const scrollSelectedChipIntoView = (smooth = true) => {
  nextTick(() => {
    document.querySelector('.day-chip.is-selected')?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'nearest',
      inline: 'center',
    })
  })
}

watch(selectedDayIndex, () => scrollSelectedChipIntoView(true))

watch(isMealDialogOpen, (isOpen) => {
  if (!isOpen) {
    selectedMeal.value = null
    selectedMealCanteen.value = null
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
