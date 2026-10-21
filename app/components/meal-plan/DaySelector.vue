<template>
  <div class="day-chips-scroll">
    <div class="day-chips-row">
      <var-chip
        v-if="previousWeekLabel"
        class="week-chip"
        plain
        :round="false"
        type="primary"
        @click="emit('select-week', weekOffset - 1)"
      >
        <svg class="week-chip-chevron" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M10 3.5 5.5 8 10 12.5" />
        </svg>
        {{ previousWeekLabel }}
      </var-chip>
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
      <var-chip
        v-if="nextWeekLabel"
        class="week-chip"
        plain
        :round="false"
        type="primary"
        @click="emit('select-week', weekOffset + 1)"
      >
        {{ nextWeekLabel }}
        <svg class="week-chip-chevron" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 3.5 10.5 8 6 12.5" />
        </svg>
      </var-chip>
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
  cursor: pointer;
  user-select: none;
}

.week-chip-chevron {
  display: inline-block;
  flex: 0 0 auto;
  vertical-align: middle;
  margin: 0 -2px 2px;
}
</style>
