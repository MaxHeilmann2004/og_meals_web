<template>
  <section class="canteen-section">
    <div class="canteen-header-row">
      <h2 class="canteen-header">{{ canteen.displayName || canteen.name }}</h2>
      <CanteenCapacityBadge
        :capacity="isToday ? capacity : null"
        :expected="isToday ? null : expectedCapacity"
        :is-today="isToday"
        :loading="loading"
        @click="emit('capacity-details', canteen)"
      />
    </div>

    <div class="meals-grid">
      <MealCard
        v-for="meal in canteen.mealsForSelectedDay"
        :key="meal.id"
        :meal="meal"
        :canteen="canteen"
        @select="emit('select-meal', meal, canteen)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Canteen, CanteenCapacity, CanteenCapacityPredictionPoint, Meal } from '~/types'
import CanteenCapacityBadge from '../capacity/CanteenCapacityBadge.vue'
import MealCard from './MealCard.vue'

type CanteenWithMeals = Canteen & { mealsForSelectedDay: Meal[] }

defineProps<{
  canteen: CanteenWithMeals
  capacity: CanteenCapacity | null
  expectedCapacity: CanteenCapacityPredictionPoint | null
  isToday: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  'select-meal': [meal: Meal, canteen: Canteen]
  'capacity-details': [canteen: Canteen]
}>()
</script>

<style scoped>
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

.meals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
  width: 100%;
}

@media (max-width: 767px) {
  .meals-grid { grid-template-columns: 1fr; }
  .canteen-header-row {
    align-items: center;
    flex-wrap: wrap;
    margin: 8px 4px 12px;
  }
  .canteen-header { font-size: 1.25rem; }
}
</style>
