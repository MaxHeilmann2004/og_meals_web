<template>
  <div v-if="isVerified" class="page-container">
    <DaySelector
      :day-names="dayNames"
      :selected-day-index="selectedDayIndex"
      @select="selectWeekday"
    />

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

      <MealPlanContent
        v-if="data"
        :filtered-canteens="filteredCanteens"
        :weekday="selectedWeekday"
        :layout="isMobile ? 'mobile' : 'desktop'"
        :total-meals-for-selected-day="totalMealsForSelectedDay"
        :pending="pending"
        :selected-day-is-today="selectedDayIsToday"
        :capacity-pending="capacityPending"
        :expectation-pending="expectationPending"
        :capacity-for-canteen="capacityForCanteen"
        :expected-capacity-for-canteen="expectedCapacityForCanteen"
        @select-meal="openMealDetails"
        @capacity-details="openCapacityDetailsWithTracking"
      />
    </div>

    <ClientOnly>
      <MealDetailDialog
        :show="isMealDialogOpen"
        :meal="selectedMeal"
        :canteen="selectedMealCanteen"
        :weekday="selectedWeekday"
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

  <section v-else class="verification-page">
    <form v-if="verificationSession?.configured" class="verification-card" @submit.prevent="submitVerification()">
      <img src="/logo.svg" alt="OG Meals Logo" class="verification-logo" />
      <h1>Access required</h1>
      <p>Scan the Kochwerk QR code or enter the verification code manually. Find the QR code in OTTO SharePoint by searching for “Kochwerk App”.</p>
      <var-button
        type="primary"
        native-type="button"
        block
        :disabled="isSubmitting"
        @click="isScannerOpen = true"
      >
        Scan QR code
      </var-button>
      <VerificationQrScanner
        v-if="isScannerOpen"
        @decoded="handleQrCode"
        @close="isScannerOpen = false"
      />
      <label for="verification-code">Verification code</label>
      <input
        id="verification-code"
        v-model="verificationCode"
        type="password"
        name="verification"
        autocomplete="current-password"
        required
        :disabled="isSubmitting"
      />
      <p v-if="verificationError" class="verification-error" role="alert">
        {{ verificationError }}
      </p>
      <var-button type="primary" native-type="submit" block :loading="isSubmitting">
        Continue
      </var-button>
    </form>
    <p v-else-if="verificationSession?.configured === false" class="verification-unavailable" role="alert">
      Meal plan access is not configured on this server.
    </p>
    <p v-else-if="verificationSessionError" class="verification-unavailable" role="alert">
      Could not check verification status. Reload the page and try again.
    </p>
    <p v-else class="verification-unavailable" role="status">
      Checking access...
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import type { Canteen, CanteenCapacityApiResponse, Meal } from '~/types'
import { getTodayCalendarDate } from '~/utils/capacity/capacity'
import { useAdminAccess } from '~/composables/useAdminAccess'
import { useCapacity } from '~/composables/useCapacity'
import DaySelector from '~/components/meal-plan/DaySelector.vue'
import MealPlanContent from '~/components/meal-plan/MealPlanContent.vue'
import VerificationQrScanner from '~/components/shared/VerificationQrScanner.vue'
import { useMealPlan } from '~/composables/useMealPlan'
import { capacityApi } from '~/services/capacityApi'

interface VerificationSession {
  configured: boolean
  authenticated: boolean
}

const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']
const selectedWeekday = computed(() => dayNames[selectedDayIndex.value]!)
const { adminToken, isAdmin } = useAdminAccess()
const verificationCode = ref('')
const verificationError = ref('')
const isSubmitting = ref(false)
const isScannerOpen = ref(false)
const {
  data: verificationSession,
  error: verificationSessionError,
} = await useFetch<VerificationSession>('/api/verification')
const isVerified = computed(() => verificationSession.value?.authenticated === true)

const verifyCode = async (token = verificationCode.value) => {
  if (!token || isSubmitting.value) return

  isSubmitting.value = true
  verificationError.value = ''
  isScannerOpen.value = false

  try {
    verificationSession.value = await $fetch<VerificationSession>('/api/verification', {
      method: 'POST',
      body: { token },
    })
    verificationCode.value = ''
  } catch (error) {
    const response = typeof error === 'object' && error !== null && 'data' in error
      ? error.data
      : null
    const statusMessage = typeof response === 'object' && response !== null && 'statusMessage' in response
      ? response.statusMessage
      : null
    verificationError.value = typeof statusMessage === 'string'
      ? statusMessage
      : 'Verification failed. Check your connection and try again.'
  } finally {
    isSubmitting.value = false
  }
}

const handleQrCode = (token: string) => {
  verificationCode.value = token
  return verifyCode(token)
}

const submitVerification = () => verifyCode()

const {
  data,
  pending,
  error,
  refresh,
  rawCanteens,
  selectedDayIndex,
  selectedDayDateStr,
  filteredCanteens,
  totalMealsForSelectedDay,
} = await useMealPlan(isVerified)
const isMobile = useMediaQuery('(max-width: 767px)')
const isMealDialogOpen = ref(false)
const selectedMeal = ref<Meal | null>(null)
const selectedMealCanteen = ref<Canteen | null>(null)

const todayDate = getTodayCalendarDate()

// Capacity is intentionally fetched separately so a capacity outage does not hide meals.
const {
  data: capacityData,
  pending: capacityPending,
} = await useAsyncData<CanteenCapacityApiResponse>(
  'canteen-capacity',
  () => capacityApi.getCurrent(),
  { immediate: isVerified.value, watch: [isVerified] },
)

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

const openMealDetails = (meal: Meal, canteen: Canteen) => {
  useTrackEvent('Meal View Opened', {
    props: {
      canteen: canteen.displayName || canteen.name,
      weekday: selectedWeekday.value,
      layout: isMobile.value ? 'mobile' : 'desktop',
      meal_id: String(meal.id),
    },
  })
  selectedMeal.value = meal
  selectedMealCanteen.value = canteen
  isMealDialogOpen.value = true
}

const openCapacityDetailsWithTracking = (canteen: Canteen) => {
  useTrackEvent('Capacity Opened', {
    props: {
      canteen: canteen.displayName || canteen.name,
      weekday: selectedWeekday.value,
      layout: isMobile.value ? 'mobile' : 'desktop',
    },
  })
  openCapacityDetails(canteen)
}

const selectWeekday = (index: number) => {
  if (index === selectedDayIndex.value) return

  selectedDayIndex.value = index
  useTrackEvent('Weekday Switched', {
    props: {
      weekday: selectedWeekday.value,
      layout: isMobile.value ? 'mobile' : 'desktop',
    },
  })
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
.verification-page {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.verification-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(100%, 360px);
  padding: 28px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 16px;
  background: var(--color-surface);
  color: var(--color-on-surface);
  box-shadow: 0 8px 28px rgb(0 0 0 / 8%);
}

.verification-logo {
  width: auto;
  height: 36px;
  align-self: center;
}

.verification-card h1,
.verification-card p {
  margin: 0;
}

.verification-card h1 {
  text-align: center;
  font-size: 1.35rem;
}

.verification-card > p {
  color: var(--color-on-surface-variant);
  text-align: center;
}

.verification-card label {
  margin-top: 8px;
  font-weight: 600;
}

.verification-card input {
  width: 100%;
  min-height: 44px;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid var(--color-outline);
  border-radius: 8px;
  background: var(--color-body);
  color: var(--color-on-surface);
  font: inherit;
}

.verification-card input:focus-visible {
  outline: 3px solid var(--color-primary-container);
  outline-offset: 2px;
}

.verification-error,
.verification-unavailable {
  color: var(--color-danger);
  text-align: center;
}

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
