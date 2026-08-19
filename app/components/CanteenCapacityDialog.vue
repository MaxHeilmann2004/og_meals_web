<template>
  <var-popup
    :show="show"
    :position="isMobile ? 'bottom' : 'center'"
    :fullscreen="isMobile"
    :safe-area="false"
    :safe-area-top="false"
    :close-on-click-overlay="true"
    @update:show="emit('update:show', $event)"
  >
    <section
      v-if="canteen"
      class="capacity-dialog"
      :class="{ 'capacity-dialog--mobile': isMobile }"
      role="dialog"
      aria-modal="true"
      :aria-label="`Auslastung ${canteen.displayName || canteen.name}`"
    >
      <button type="button" class="capacity-dialog-close" aria-label="Schließen" @click="emit('update:show', false)">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div class="capacity-dialog-scroll">
        <header class="capacity-dialog-header">
          <p class="capacity-dialog-eyebrow">
            {{ isToday ? 'Aktuelle Auslastung' : 'Erwartete Auslastung' }}
          </p>
          <h2>{{ canteen.displayName || canteen.name }}</h2>
          <p v-if="!isToday" class="capacity-dialog-date">
            {{ formatCapacityCalendarDate(selectedDate) }}
          </p>
        </header>

        <div v-if="isToday && currentCapacity" class="capacity-summary">
          <strong class="capacity-summary-percent">
            {{ formatCapacityPercent(currentCapacity.relativePercent) }}
          </strong>
          <span v-if="currentCapacity.absolutePersons != null" class="capacity-summary-persons">
            etwa {{ formatCapacityPersons(currentCapacity.absolutePersons) }}
          </span>
          <span v-if="sampledAt" class="capacity-summary-time">
            Stand: {{ sampledAt }} Uhr
          </span>
          <span v-if="stale" class="capacity-summary-stale">Daten möglicherweise veraltet</span>
        </div>
        <div v-else-if="!isToday && expectedCapacity" class="capacity-summary">
          <strong class="capacity-summary-percent">
            {{ formatCapacityPercent(expectedCapacity.relativePercent) }}
          </strong>
          <span class="capacity-summary-persons">erwartete Auslastung</span>
          <span v-if="expectedTime" class="capacity-summary-time">
            Erwartet gegen {{ expectedTime }} Uhr
          </span>
        </div>
        <p v-else class="capacity-summary-empty">
          {{ isToday ? 'Für diese Kantine sind aktuell keine Kapazitätsdaten verfügbar.' : 'Für diesen Tag ist keine Erwartung verfügbar.' }}
        </p>

        <section class="capacity-chart-section" aria-labelledby="capacity-chart-heading">
          <div class="capacity-chart-heading-row">
            <h3 id="capacity-chart-heading">
              {{ isToday ? 'Auslastung heute' : `Erwartung für ${formatCapacityCalendarDate(selectedDate)}` }}
            </h3>
            <button
              v-if="timelineError"
              type="button"
              class="capacity-retry-button"
              @click="emit('retry')"
            >
              Erneut versuchen
            </button>
          </div>

          <div v-if="timelineLoading" class="capacity-chart-loading">
            <LoadingSpinner size="40px" label="Verlauf wird geladen..." />
          </div>
          <p v-else-if="timelineError" class="capacity-chart-error">
            Der Auslastungsverlauf konnte nicht geladen werden.
          </p>
          <CanteenCapacityChart
            v-else-if="timeline"
            :timeline="timeline"
            :show-actual="isToday"
            :empty-message="emptyMessage"
          />
          <p v-else class="capacity-chart-error">
            {{ emptyMessage }}
          </p>
        </section>

        <p v-if="predictionDescription" class="capacity-prediction-note">
          {{ predictionDescription }}
        </p>
      </div>
    </section>
  </var-popup>
</template>

<script setup lang="ts">
import { onUnmounted, watch } from 'vue'
import type {
  Canteen,
  CanteenCapacity,
  CanteenCapacityPredictionPoint,
  CanteenCapacityTimeline,
} from '~/types/meals'
import {
  formatCapacityCalendarDate,
  formatCapacityPercent,
  formatCapacityPersons,
  formatCapacityTime,
  isCapacityStale,
  predictionPointToDate,
} from '~/utils/canteenCapacity'

const props = defineProps<{
  show: boolean
  canteen: Canteen | null
  currentCapacity: CanteenCapacity | null
  expectedCapacity: CanteenCapacityPredictionPoint | null
  selectedDate: string
  isToday: boolean
  timeline: CanteenCapacityTimeline | null
  timelineLoading: boolean
  timelineError: Error | null
  isMobile: boolean
}>()

const emit = defineEmits<{
  'update:show': [show: boolean]
  retry: []
}>()

const sampledAt = computed(() => props.currentCapacity ? formatCapacityTime(props.currentCapacity.timestamp) : null)
const stale = computed(() => !!props.currentCapacity && isCapacityStale(props.currentCapacity.timestamp))
const expectedTime = computed(() => {
  if (!props.expectedCapacity) return null
  const date = predictionPointToDate(props.selectedDate, props.expectedCapacity)
  return date ? formatCapacityTime(date.toISOString()) : null
})
const emptyMessage = computed(() => props.isToday
  ? 'Für heute sind noch keine Auslastungsdaten verfügbar.'
  : 'Für diesen Tag sind keine berechneten Erwartungsdaten verfügbar.')
const predictionDescription = computed(() => {
  const dates = props.timeline?.prediction?.basedOnDates ?? []
  if (dates.length === 0) return null
  return `Erwartung berechnet aus ${dates.length} vergangenen ${dates.length === 1 ? 'Tag' : 'Tagen'} mit vergleichbarem Wochentag.`
})

const handlePopState = () => {
  emit('update:show', false)
}

watch(() => props.show, (show) => {
  if (typeof window === 'undefined') return

  if (show && props.canteen) {
    window.addEventListener('popstate', handlePopState)
    window.history.pushState({ capacityDialogOpen: true }, '')
  } else {
    window.removeEventListener('popstate', handlePopState)
    if (window.history.state?.capacityDialogOpen) window.history.back()
  }
})

onUnmounted(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('popstate', handlePopState)
  if (window.history.state?.capacityDialogOpen) window.history.back()
})
</script>

<style scoped>
:deep(.var-popup__content) {
  background: transparent !important;
  box-shadow: none !important;
}

.capacity-dialog {
  position: relative;
  width: min(680px, calc(100vw - 32px));
  max-height: min(760px, calc(100dvh - 32px));
  overflow: hidden;
  border-radius: 32px;
  background: var(--color-surface-container-low);
  color: var(--color-on-surface);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
}

.capacity-dialog--mobile {
  width: 100%;
  max-height: 100%;
  height: 100%;
  border-radius: 0;
}

.capacity-dialog-scroll {
  max-height: inherit;
  overflow-y: auto;
  padding: 32px 28px calc(32px + env(safe-area-inset-bottom, 0px));
}

.capacity-dialog--mobile .capacity-dialog-scroll {
  padding: 24px 18px calc(24px + env(safe-area-inset-bottom, 0px));
}

.capacity-dialog-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: var(--color-surface-container-highest);
  color: var(--color-on-surface);
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.capacity-dialog-close:hover {
  background: var(--color-surface-container-high);
  transform: scale(1.05);
}

.capacity-dialog-close:focus-visible,
.capacity-retry-button:focus-visible {
  outline: 3px solid var(--color-primary-container);
  outline-offset: 2px;
}

.capacity-dialog-header {
  padding-right: 52px;
}

.capacity-dialog-eyebrow {
  margin: 0 0 6px;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.capacity-dialog-header h2 {
  margin: 0;
  font-size: clamp(1.4rem, 3vw, 2rem);
  line-height: 1.15;
}

.capacity-dialog-date {
  margin: 6px 0 0;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  text-transform: capitalize;
}

.capacity-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 28px 0 24px;
  text-align: center;
}

.capacity-summary-percent {
  color: var(--color-primary);
  font-size: clamp(3rem, 10vw, 4.5rem);
  font-weight: 800;
  letter-spacing: -0.06em;
  line-height: 0.95;
}

.capacity-summary-persons {
  font-size: 1rem;
  font-weight: 600;
}

.capacity-summary-time,
.capacity-summary-stale {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.capacity-summary-stale {
  color: var(--color-warning);
  font-weight: 600;
}

.capacity-summary-empty {
  margin: 28px 0 24px;
  color: var(--color-text-muted);
  text-align: center;
}

.capacity-chart-section {
  padding: 20px 0 8px;
}

.capacity-chart-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.capacity-chart-heading-row h3 {
  margin: 0;
  font-size: 1.05rem;
}

.capacity-retry-button {
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
}

.capacity-chart-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
}

.capacity-chart-error,
.capacity-prediction-note {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  line-height: 1.45;
}

.capacity-chart-error {
  margin: 0;
  padding: 48px 16px;
  text-align: center;
}

.capacity-prediction-note {
  margin: 16px 0 0;
  text-align: center;
}

@media (max-width: 500px) {
  .capacity-chart-heading-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
