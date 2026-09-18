<template>
  <div class="canteens-list">
    <CanteenSection
      v-for="canteen in filteredCanteens"
      :key="canteen.id"
      :canteen="canteen"
      :capacity="capacityForCanteen(canteen.id)"
      :expected-capacity="expectedCapacityForCanteen(canteen.id)"
      :is-today="selectedDayIsToday"
      :loading="selectedDayIsToday ? capacityPending : expectationPending"
      @select-meal="selectMeal"
      @capacity-details="emit('capacity-details', $event)"
    />

    <div v-if="totalMealsForSelectedDay === 0 && !pending" class="no-meals-state">
      <p>Keine Gerichte für diesen Tag verfügbar.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Canteen, CanteenCapacity, CanteenCapacityPredictionPoint, Meal } from '~/types'
import CanteenSection from './CanteenSection.vue'

type CanteenWithMeals = Canteen & { mealsForSelectedDay: Meal[] }

defineProps<{
  filteredCanteens: CanteenWithMeals[]
  totalMealsForSelectedDay: number
  pending: boolean
  selectedDayIsToday: boolean
  capacityPending: boolean
  expectationPending: boolean
  capacityForCanteen: (canteenId: number) => CanteenCapacity | null
  expectedCapacityForCanteen: (canteenId: number) => CanteenCapacityPredictionPoint | null
}>()

const emit = defineEmits<{
  'select-meal': [meal: Meal, canteen: Canteen]
  'capacity-details': [canteen: Canteen]
}>()

const selectMeal = (meal: Meal, canteen: Canteen) => emit('select-meal', meal, canteen)
</script>

<style scoped>
.canteens-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1300px;
  margin: 0 auto;
  padding: 8px 16px 24px;
  box-sizing: border-box;
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

@media (max-width: 767px) {
  .canteens-list { padding: 8px 4px 24px; }
}
</style>
