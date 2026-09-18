<template>
  <section class="capacity-chart-section" aria-labelledby="capacity-chart-heading">
    <div class="capacity-chart-heading-row">
      <h3 id="capacity-chart-heading">
        {{ isToday ? 'Auslastung heute' : `Erwartung für ${formatCapacityCalendarDate(selectedDate)}` }}
      </h3>
      <button v-if="timelineError" type="button" class="capacity-retry-button" @click="emit('retry')">
        Erneut versuchen
      </button>
    </div>

    <div v-if="timelineLoading" class="capacity-chart-loading">
      <LoadingSpinner size="40px" label="Verlauf wird geladen..." />
    </div>
    <p v-else-if="timelineError" class="capacity-chart-error">Der Auslastungsverlauf konnte nicht geladen werden.</p>
    <CanteenCapacityChart
      v-else-if="timeline"
      :timeline="timeline"
      :show-actual="isToday"
      :empty-message="emptyMessage"
    />
    <p v-else class="capacity-chart-error">{{ emptyMessage }}</p>
  </section>

  <p v-if="predictionDescription" class="capacity-prediction-note">{{ predictionDescription }}</p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CanteenCapacityTimeline } from '~/types'
import { formatCapacityCalendarDate } from '~/utils/canteenCapacity'
import CanteenCapacityChart from './CanteenCapacityChart.vue'

const props = defineProps<{
  timeline: CanteenCapacityTimeline | null
  timelineLoading: boolean
  timelineError: Error | null
  selectedDate: string
  isToday: boolean
}>()

const emit = defineEmits<{ retry: [] }>()

const emptyMessage = computed(() => props.isToday
  ? 'Für heute sind noch keine Auslastungsdaten verfügbar.'
  : 'Für diesen Tag sind keine berechneten Erwartungsdaten verfügbar.')
const predictionDescription = computed(() => {
  const dates = props.timeline?.prediction?.basedOnDates ?? []
  if (dates.length === 0) return null
  return `Erwartung berechnet aus ${dates.length} vergangenen ${dates.length === 1 ? 'Tag' : 'Tagen'} mit vergleichbarem Wochentag.`
})
</script>

<style scoped>
.capacity-chart-section { padding: 20px 0 8px; }

.capacity-chart-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.capacity-chart-heading-row h3 { margin: 0; font-size: 1.05rem; }

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

.capacity-prediction-note { margin: 16px 0 0; text-align: center; }

@media (max-width: 500px) {
  .capacity-chart-heading-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
