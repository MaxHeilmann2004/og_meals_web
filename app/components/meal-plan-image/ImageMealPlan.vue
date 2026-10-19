<template>
  <div data-image-root :style="rootStyle">
    <div :style="listStyle">
      <ImageCanteenSection
        v-for="canteen in canteens"
        :key="canteen.id"
        :canteen="canteen"
        :layout="layout"
        :colors="colors"
        :show-student-prices="showStudentPrices"
      />
      <div v-if="canteens.length === 0" :style="emptyStyle">
        Keine Gerichte für diesen Tag verfügbar.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Root of the Satori-rendered meal plan image; counterpart of meal-plan/MealPlanContent.vue.
import { computed } from 'vue'
import type { MealPlanImageTheme } from '~/config/mealPlanImage'
import { getMealPlanImageColors, MEAL_PLAN_IMAGE_FONT_FAMILY } from '~/config/mealPlanImageTheme'
import type { CanteenWithMeals } from '~/utils/meal/imageSelection'
import { getMealPlanImageLayout, MEAL_PLAN_IMAGE_PADDING_X } from '~/utils/meal/imageLayout'
import ImageCanteenSection from './ImageCanteenSection.vue'

const props = defineProps<{
  canteens: CanteenWithMeals[]
  width: number
  theme: MealPlanImageTheme
  showStudentPrices: boolean
}>()

const colors = computed(() => getMealPlanImageColors(props.theme))
const layout = computed(() => getMealPlanImageLayout(props.width))

const rootStyle = computed(() => ({
  display: 'flex',
  justifyContent: 'center',
  width: `${props.width}px`,
  backgroundColor: colors.value.background,
  color: colors.value.onSurface,
  fontFamily: MEAL_PLAN_IMAGE_FONT_FAMILY,
}))

const listStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column',
  width: `${layout.value.contentWidth + MEAL_PLAN_IMAGE_PADDING_X * 2}px`,
  padding: `8px ${MEAL_PLAN_IMAGE_PADDING_X}px 24px`,
  boxSizing: 'border-box',
}))

const emptyStyle = computed(() => ({
  display: 'flex',
  justifyContent: 'center',
  padding: '48px',
  fontWeight: 500,
  color: colors.value.onSurfaceVariant,
}))
</script>
