<template>
  <div class="day-chips-scroll">
    <div class="day-chips-row">
      <template v-if="previousWeekLabel">
        <button type="button" class="week-chip" @click="emit('select-week', weekOffset - 1)">
          <svg class="week-chip-chevron" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M10 3.5 5.5 8 10 12.5" />
          </svg>
          {{ previousWeekLabel }}
        </button>
      </template>
      <var-chip
        v-for="(dayName, index) in dayNames"
        :key="dayName"
        class="day-chip"
        :class="{ 'is-selected': index === selectedDayIndex }"
        :plain="index !== selectedDayIndex"
        :round="false"
        type="primary"
        @click="emit('select', index)"
      >
        {{ dayName }}
      </var-chip>
      <template v-if="nextWeekLabel">
        <button type="button" class="week-chip" @click="emit('select-week', weekOffset + 1)">
          {{ nextWeekLabel }}
          <svg class="week-chip-chevron" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 3.5 10.5 8 6 12.5" />
          </svg>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  dayNames: string[]
  selectedDayIndex: number
  weekOffset: number
  previousWeekLabel?: string | null
  nextWeekLabel?: string | null
}>()

const emit = defineEmits<{
  select: [index: number]
  'select-week': [weekOffset: number]
}>()
</script>

<style scoped>
.day-chips-scroll {
  width: 100%;
  overflow-x: auto;
  background-color: var(--color-surface);
  padding: 8px 16px;
  box-sizing: border-box;
  scrollbar-width: none;
}

.day-chips-scroll::-webkit-scrollbar { display: none; }

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

.day-chip.is-selected { font-weight: 700; }

.week-chip {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 7px;
  min-height: 32px;
  box-sizing: border-box;
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: var(--color-surface-container-high);
  color: var(--color-on-surface);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.week-chip:hover { border-color: var(--color-outline-variant); }

.week-chip:focus-visible {
  outline: 3px solid var(--color-primary-container);
  outline-offset: 2px;
}

.week-chip-chevron { flex: 0 0 auto; }
</style>
