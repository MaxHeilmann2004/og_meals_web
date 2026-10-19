<template>
  <ImageMealPlan
    :canteens="canteens"
    :width="width"
    :theme="theme"
    :show-student-prices="showStudentPrices"
  />
</template>

<script setup lang="ts">
// Internal page rendered to HTML by server/utils/mealPlanImage; guarded by server/middleware/meal-plan-image-guard.ts.
import { computed } from 'vue'
import type { MealsApiResponse } from '~/types'
import {
  MEAL_PLAN_IMAGE_DEFAULT_WIDTH,
  MEAL_PLAN_IMAGE_MAX_WIDTH,
  MEAL_PLAN_IMAGE_MIN_WIDTH,
  type MealPlanImageTheme,
} from '~/config/mealPlanImage'
import { mealsApi } from '~/services/mealsApi'
import { selectMealPlanImageCanteens } from '~/utils/meal/imageSelection'

definePageMeta({ layout: 'image' })

const query = useRoute().query
const first = (value: unknown) => String(Array.isArray(value) ? value[0] : value ?? '')

const date = first(query.date)
const width = Math.min(
  MEAL_PLAN_IMAGE_MAX_WIDTH,
  Math.max(MEAL_PLAN_IMAGE_MIN_WIDTH, Number.parseInt(first(query.width), 10) || MEAL_PLAN_IMAGE_DEFAULT_WIDTH),
)
const theme: MealPlanImageTheme = first(query.theme) === 'dark' ? 'dark' : 'light'
const showStudentPrices = first(query.studentPrices) === '1'

const { data, error } = await useAsyncData<MealsApiResponse>(
  'meal-plan-image',
  () => mealsApi.getWeek(date, date),
)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode && error.value.statusCode >= 400 ? error.value.statusCode : 502,
    statusMessage: 'Speiseplan konnte nicht geladen werden.',
    fatal: true,
  })
}

const canteens = computed(() => selectMealPlanImageCanteens(
  data.value?.canteens ?? [],
  data.value?.meals ?? [],
  date,
))
</script>
