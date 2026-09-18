<template>
  <div v-if="isToday && currentCapacity" class="capacity-summary">
    <strong class="capacity-summary-percent">{{ formatCapacityPercent(currentCapacity.relativePercent) }}</strong>
    <span v-if="currentCapacity.absolutePersons != null" class="capacity-summary-persons">
      etwa {{ formatCapacityPersons(currentCapacity.absolutePersons) }}
    </span>
    <span v-if="sampledAt" class="capacity-summary-time">Stand: {{ sampledAt }} Uhr</span>
    <span v-if="stale" class="capacity-summary-stale">Daten möglicherweise veraltet</span>
  </div>
  <div v-else-if="!isToday && expectedCapacity" class="capacity-summary">
    <strong class="capacity-summary-percent">{{ formatCapacityPercent(expectedCapacity.relativePercent) }}</strong>
    <span class="capacity-summary-persons">erwartete Auslastung</span>
    <span v-if="expectedTime" class="capacity-summary-time">Erwartet gegen {{ expectedTime }} Uhr</span>
  </div>
  <p v-else class="capacity-summary-empty">
    {{ isToday ? 'Für diese Kantine sind aktuell keine Kapazitätsdaten verfügbar.' : 'Für diesen Tag ist keine Erwartung verfügbar.' }}
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CanteenCapacity, CanteenCapacityPredictionPoint } from '~/types'
import {
  formatCapacityPercent,
  formatCapacityPersons,
  formatCapacityTime,
  isCapacityStale,
  predictionPointToDate,
} from '~/utils/canteenCapacity'

const props = defineProps<{
  currentCapacity: CanteenCapacity | null
  expectedCapacity: CanteenCapacityPredictionPoint | null
  selectedDate: string
  isToday: boolean
}>()

const sampledAt = computed(() => props.currentCapacity ? formatCapacityTime(props.currentCapacity.timestamp) : null)
const stale = computed(() => !!props.currentCapacity && isCapacityStale(props.currentCapacity.timestamp))
const expectedTime = computed(() => {
  if (!props.expectedCapacity) return null
  const date = predictionPointToDate(props.selectedDate, props.expectedCapacity)
  return date ? formatCapacityTime(date.toISOString()) : null
})

</script>

<style scoped>
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

.capacity-summary-persons { font-size: 1rem; font-weight: 600; }
.capacity-summary-time,
.capacity-summary-stale { color: var(--color-text-muted); font-size: 0.8125rem; }
.capacity-summary-stale { color: var(--color-warning); font-weight: 600; }

.capacity-summary-empty {
  margin: 28px 0 24px;
  color: var(--color-text-muted);
  text-align: center;
}
</style>
