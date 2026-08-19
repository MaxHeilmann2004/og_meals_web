<template>
  <button
    type="button"
    class="capacity-badge"
    :class="[
      displayValue ? `capacity-badge--${displayStatus}` : 'capacity-badge--unknown',
      { 'capacity-badge--stale': isToday && capacity && stale },
    ]"
    :aria-label="ariaLabel"
    :title="ariaLabel"
    @click="emit('click')"
  >
    <span class="capacity-badge-dot" aria-hidden="true"></span>
    <span v-if="loading" class="capacity-badge-text">
      {{ isToday ? 'Kapazität wird geladen' : 'Erwartung wird geladen' }}
    </span>
    <span v-else-if="isToday && capacity" class="capacity-badge-text">
      {{ formatCapacityPercent(capacity.relativePercent) }} belegt
    </span>
    <span v-else-if="!isToday && expected" class="capacity-badge-text">
      {{ formatCapacityPercent(expected.relativePercent) }} erwartet
    </span>
    <span v-else class="capacity-badge-text">
      {{ isToday ? 'Keine aktuellen Daten' : 'Keine Erwartung' }}
    </span>
    <span class="capacity-badge-chevron" aria-hidden="true">›</span>
  </button>
</template>

<script setup lang="ts">
import type { CanteenCapacity } from '~/types/meals'
import {
  formatCapacityPercent,
  formatCapacityTime,
  getCapacityStatus,
  getCapacityStatusLabel,
  isCapacityStale,
} from '~/utils/canteenCapacity'
import type { CanteenCapacityPredictionPoint } from '~/types/meals'

const props = defineProps<{
  capacity: CanteenCapacity | null
  expected: CanteenCapacityPredictionPoint | null
  isToday: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const status = computed(() => (props.capacity ? getCapacityStatus(props.capacity.relativePercent) : null))
const expectedStatus = computed(() => (props.expected ? getCapacityStatus(props.expected.relativePercent) : null))
const displayValue = computed(() => props.isToday ? props.capacity : props.expected)
const displayStatus = computed(() => props.isToday ? status.value : expectedStatus.value)
const stale = computed(() => !!props.capacity && isCapacityStale(props.capacity.timestamp))

const ariaLabel = computed(() => {
  if (props.loading) return `${props.isToday ? 'Kapazität' : 'Erwartung'} wird geladen. Kapazitätsverlauf öffnen.`
  if (props.isToday) {
    if (!props.capacity) return 'Keine aktuellen Kapazitätsdaten. Kapazitätsverlauf öffnen.'
    const statusLabel = status.value ? getCapacityStatusLabel(status.value) : 'Auslastung'
    const time = formatCapacityTime(props.capacity.timestamp)
    const staleLabel = stale.value ? ' Die Daten sind möglicherweise veraltet.' : ''
    const personLabel = props.capacity.absolutePersons == null
      ? ''
      : ` Etwa ${new Intl.NumberFormat('de-DE').format(Math.round(props.capacity.absolutePersons))} Personen.`

    return `${formatCapacityPercent(props.capacity.relativePercent)} belegt. ${statusLabel}.${personLabel}${time ? ` Stand ${time} Uhr.` : ''}${staleLabel} Kapazitätsverlauf öffnen.`
  }

  if (!props.expected) return 'Keine erwartete Auslastung verfügbar. Erwartungsverlauf öffnen.'
  return `${formatCapacityPercent(props.expected.relativePercent)} erwartet. Erwartungsverlauf öffnen.`
})
</script>

<style scoped>
.capacity-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 32px;
  max-width: 100%;
  box-sizing: border-box;
  padding: 6px 10px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: var(--color-surface-container-high);
  color: var(--color-on-surface);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.capacity-badge:hover {
  border-color: var(--color-outline-variant);
}

.capacity-badge:focus-visible {
  outline: 3px solid var(--color-primary-container);
  outline-offset: 2px;
}

.capacity-badge--moderate {
  background: var(--color-warning-container);
  color: var(--color-on-warning-container);
}

.capacity-badge--busy {
  background: var(--color-danger-container);
  color: var(--color-on-danger-container);
}

.capacity-badge--stale {
  opacity: 0.72;
}

.capacity-badge-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
  background: currentColor;
}

.capacity-badge--moderate .capacity-badge-dot,
.capacity-badge--busy .capacity-badge-dot {
  background: currentColor;
}

.capacity-badge-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.capacity-badge-chevron {
  margin-left: 1px;
  font-size: 1.15rem;
  font-weight: 400;
  line-height: 0.8;
}

@media (max-width: 500px) {
  .capacity-badge {
    font-size: 0.75rem;
  }
}
</style>
