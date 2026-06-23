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
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-overlay">
        <var-loading type="cube" size="large" color="var(--color-primary)" description="Lade Speiseplan..." />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-banner">
        <span class="error-text">Fehler beim Laden: {{ error }}</span>
        <var-button type="primary" size="small" @click="fetchMeals">Erneut versuchen</var-button>
      </div>

      <!-- Meals Content -->
      <div v-else class="canteens-list">
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
            />
          </div>
        </div>

        <!-- No Meals State -->
        <div v-if="totalMealsForSelectedDay === 0" class="no-meals-state">
          <p>Keine Gerichte für diesen Tag verfügbar.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'

interface MealImageDto {
  url: string
  aiSuggested: boolean
}

interface MealFeature {
  id: number
  name?: string | null
  shortName?: string | null
  showInFilter?: boolean | null
}

interface Meal {
  id: number
  title: string
  price: number | null
  studentPrice: number | null
  date: string
  canteenId: number
  images: MealImageDto[]
  features: MealFeature[]
}

interface Canteen {
  id: number
  name: string
  displayName: string
  meals: Meal[]
  mealsForSelectedDay?: Meal[]
}

const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']

// Date logic
const getWorkDayScopedToday = () => {
  const today = new Date()
  const day = today.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  if (day === 6) {
    today.setDate(today.getDate() + 2) // Saturday -> Next Monday
  } else if (day === 0) {
    today.setDate(today.getDate() + 1) // Sunday -> Next Monday
  }
  return today
}

const getWeekDates = () => {
  const today = getWorkDayScopedToday()
  const day = today.getDay()
  const isoDayNumber = day === 0 ? 7 : day // Monday is 1, Sunday is 7
  
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - (isoDayNumber - 1))
  
  const dates: Date[] = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    dates.push(d)
  }
  return dates
}

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const weekDates = getWeekDates()
const startOfWeekStr = formatDate(weekDates[0]!)
const endOfWeekStr = formatDate(weekDates[4]!)

// Determine default selected day index based on current day of the week
const getInitialDayIndex = () => {
  const today = new Date()
  const day = today.getDay()
  if (day === 0 || day === 6) return 0 // Weekend defaults to Monday
  return day - 1 // 1 (Monday) -> 0, 5 (Friday) -> 4
}

const selectedDayIndex = ref(getInitialDayIndex())
const selectedDayDateStr = computed(() => formatDate(weekDates[selectedDayIndex.value]!))

// API states
const isLoading = ref(true)
const error = ref<string | null>(null)
const rawCanteens = ref<Canteen[]>([])
const rawMeals = ref<Meal[]>([])

const fetchMeals = async () => {
  isLoading.value = true
  error.value = null
  try {
    const res = await fetch(
      `https://3b-meals.mh-home.net/meals?start=${startOfWeekStr}&end=${endOfWeekStr}`
    )
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    const data = await res.json()
    rawCanteens.value = data.canteens || []
    rawMeals.value = data.meals || []
  } catch (e: any) {
    error.value = e.message || 'Ein unbekannter Fehler ist aufgetreten.'
  } finally {
    isLoading.value = false
  }
}

// Group and filter canteens
const filteredCanteens = computed(() => {
  // Only canteens with IDs 6, 7, 8 (matching native app filter)
  const allowedCanteenIds = [6, 7, 8]
  
  return rawCanteens.value
    .filter(c => allowedCanteenIds.includes(c.id))
    .map(c => {
      // Find and map meals belonging to this canteen on the selected date
      const mealsForCanteen = rawMeals.value.filter(meal => {
        const mealCanteenId = Number(meal.canteenId)
        const mealDatePart = meal.date.split('T')[0]
        return mealCanteenId === c.id && mealDatePart === selectedDayDateStr.value
      })
      
      return {
        ...c,
        mealsForSelectedDay: mealsForCanteen
      }
    })
    // Only display canteens that actually have meals on the selected day
    .filter(c => c.mealsForSelectedDay && c.mealsForSelectedDay.length > 0)
})

const totalMealsForSelectedDay = computed(() => {
  return filteredCanteens.value.reduce((acc, c) => acc + (c.mealsForSelectedDay?.length || 0), 0)
})

const scrollSelectedChipIntoView = (smooth = true) => {
  nextTick(() => {
    const selectedEl = document.querySelector('.day-chip.is-selected')
    if (selectedEl) {
      selectedEl.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'nearest',
        inline: 'center'
      })
    }
  })
}

watch(selectedDayIndex, () => {
  scrollSelectedChipIntoView(true)
})

onMounted(() => {
  fetchMeals()
  scrollSelectedChipIntoView(false)
})
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

@media (max-width: 440px) {
  .meals-grid {
    grid-template-columns: 1fr;
  }
  .canteens-list {
    padding: 8px 12px 24px;
  }
  .canteen-header {
    margin: 8px 8px 12px;
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
