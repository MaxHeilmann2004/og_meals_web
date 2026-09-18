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

        <CapacitySummary
          :current-capacity="currentCapacity"
          :expected-capacity="expectedCapacity"
          :selected-date="selectedDate"
          :is-today="isToday"
        />
        <CapacityTimeline
          :timeline="timeline"
          :timeline-loading="timelineLoading"
          :timeline-error="timelineError"
          :selected-date="selectedDate"
          :is-today="isToday"
          @retry="emit('retry')"
        />
      </div>
    </section>
  </var-popup>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import type {
  Canteen,
  CanteenCapacity,
  CanteenCapacityPredictionPoint,
  CanteenCapacityTimeline,
} from '~/types'
import { formatCapacityCalendarDate } from '~/utils/canteenCapacity'
import { useDialogHistory } from '~/composables/useDialogHistory'
import CapacitySummary from './CapacitySummary.vue'
import CapacityTimeline from './CapacityTimeline.vue'

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

useDialogHistory(
  toRef(props, 'show'),
  computed(() => !!props.canteen),
  'capacityDialogOpen',
  () => emit('update:show', false),
)
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

</style>
