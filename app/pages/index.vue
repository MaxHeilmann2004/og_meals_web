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
        <var-loading type="cube" size="large" color="var(--color-primary)" description="Lade Speiseplan..." />
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
          <h2 class="canteen-header">{{ canteen.displayName || canteen.name }}</h2>

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
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, inject } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import type { Canteen, Meal, MealsApiResponse } from '~/types/meals'
import { useFilterStore } from '~/stores/filters'

const filterStore = useFilterStore()
const setLayoutCanteens = inject<(c: Pick<Canteen, 'id' | 'name' | 'displayName' | 'orderInApp'>[]) => void>('setLayoutCanteens')

const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']

// Date helpers
const getWorkDayScopedToday = () => {
  const today = new Date()
  const day = today.getDay()
  if (day === 6) today.setDate(today.getDate() + 2) // Saturday -> Monday
  else if (day === 0) today.setDate(today.getDate() + 1) // Sunday -> Monday
  return today
}

const getWeekDates = () => {
  const today = getWorkDayScopedToday()
  const isoDayNumber = today.getDay() === 0 ? 7 : today.getDay()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - (isoDayNumber - 1))
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d
  })
}

const formatDate = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const weekDates = getWeekDates()
const startOfWeekStr = formatDate(weekDates[0]!)
const endOfWeekStr = formatDate(weekDates[4]!)
const route = useRoute()

const adminToken = computed(() => {
  const rawToken = route.query.adminToken
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken
  return typeof token === 'string' ? token.trim() : ''
})

const isAdmin = computed(() => adminToken.value.length > 0)

const getInitialDayIndex = () => {
  const day = new Date().getDay()
  if (day === 0 || day === 6) return 0 // Weekend -> Monday
  return day - 1 // Mon=0 … Fri=4
}

const selectedDayIndex = ref(getInitialDayIndex())
const selectedDayDateStr = computed(() => formatDate(weekDates[selectedDayIndex.value]!))
const isMobile = useMediaQuery('(max-width: 767px)')
const isMealDialogOpen = ref(false)
const selectedMeal = ref<Meal | null>(null)
const selectedMealCanteen = ref<Canteen | null>(null)

// Server-side data fetch — pre-rendered and sent to the client
const { data, pending, error, refresh } = await useAsyncData<MealsApiResponse>(
  'meals-week',
  () => $fetch(`https://3b-meals.mh-home.net/meals?start=${startOfWeekStr}&end=${endOfWeekStr}`)
)

const rawCanteens = computed(() => {
  const canteens = data.value?.canteens ?? []
  return [...canteens].sort((a, b) => {
    const aOrder = a.orderInApp ?? Number.MAX_SAFE_INTEGER
    const bOrder = b.orderInApp ?? Number.MAX_SAFE_INTEGER
    return aOrder - bOrder
  })
})
const rawMeals = computed(() => data.value?.meals ?? [])

// Sync canteen list to filter store and layout whenever data arrives
watch(rawCanteens, (canteens) => {
  filterStore.initFromCanteens(canteens)
  setLayoutCanteens?.(canteens.map(c => ({ id: c.id, name: c.name, displayName: c.displayName, orderInApp: c.orderInApp })))
}, { immediate: true })

// Group meals by canteen for the selected day, applying active filters
const filteredCanteens = computed(() => {
  return rawCanteens.value
    .filter(c => filterStore.isCanteenEnabled(c.id))
    .map(c => {
      const mealsForSelectedDay = rawMeals.value.filter(meal => {
        if (Number(meal.canteenId) !== c.id) return false
        if (meal.date.split('T')[0] !== selectedDayDateStr.value) return false

        // Exclusions
        if (meal.features?.some(f => filterStore.isFeatureExcluded(f.id))) return false

        // Inclusions
        const activeIncludes = Object.keys(filterStore.includedFeatures)
          .map(Number)
          .filter(id => filterStore.isFeatureIncluded(id))

        if (activeIncludes.length > 0) {
          const satisfiesAll = activeIncludes.every(incId => {
            if (incId === 25) {
              // Vegetarian includes both vegetarian and vegan dishes
              return meal.features?.some(f => f.id === 25 || f.id === 11)
            }
            return meal.features?.some(f => f.id === incId)
          })
          if (!satisfiesAll) return false
        }

        return true
      })
      return { ...c, mealsForSelectedDay }
    })
    .filter(c => c.mealsForSelectedDay.length > 0)
})

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

.canteen-header {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-on-surface);
  margin: 12px 12px 16px;
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
  .canteen-header {
    margin: 8px 4px 12px;
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
