<template>
  <div class="day-chips-scroll">
    <div class="day-chips-row">
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
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  dayNames: string[]
  selectedDayIndex: number
}>()

const emit = defineEmits<{
  select: [index: number]
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
</style>
