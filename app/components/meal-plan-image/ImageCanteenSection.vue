<template>
  <div :style="sectionStyle">
    <div :style="headerStyle">{{ canteen.displayName || canteen.name }}</div>
    <div :style="gridStyle">
      <ImageMealCard
        v-for="meal in canteen.mealsForSelectedDay"
        :key="meal.id"
        :meal="meal"
        :canteen="canteen"
        :layout="layout"
        :colors="colors"
        :show-student-prices="showStudentPrices"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Satori-compatible counterpart of meal-plan/CanteenSection.vue (without the capacity badge).
import { computed } from 'vue'
import type { MealPlanImageColors } from '~/config/mealPlanImageTheme'
import type { CanteenWithMeals } from '~/utils/meal/imageSelection'
import { MEAL_PLAN_IMAGE_GRID_GAP, type MealPlanImageLayout } from '~/utils/meal/imageLayout'
import ImageMealCard from './ImageMealCard.vue'

const props = defineProps<{
  canteen: CanteenWithMeals
  layout: MealPlanImageLayout
  colors: MealPlanImageColors
  showStudentPrices: boolean
}>()

const sectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  marginTop: '12px',
}

const headerStyle = computed(() => ({
  margin: '12px 12px 16px',
  fontSize: '24px',
  fontWeight: 700,
  lineHeight: 1.2,
  color: props.colors.onSurface,
}))

// Satori only supports flexbox, so the CSS grid is emulated with a wrapping flex row.
const gridStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%',
  columnGap: `${MEAL_PLAN_IMAGE_GRID_GAP}px`,
  rowGap: `${MEAL_PLAN_IMAGE_GRID_GAP}px`,
}
</script>
