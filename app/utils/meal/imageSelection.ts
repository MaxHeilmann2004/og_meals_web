import type { Canteen, Meal } from '~/types'
import { MEAL_PLAN_IMAGE_CANTEEN_IDS, MEAL_PLAN_IMAGE_CATEGORIES } from '~/config/mealPlanImage'
import { compareCanteens } from '~/utils/canteen/order'
import { filterMealsForDay } from '~/utils/meal/filtering'
import { compareMealsByCategory } from '~/utils/meal/order'

export type CanteenWithMeals = Canteen & { mealsForSelectedDay: Meal[] }

const NO_FILTERS = {
  isSaladExcluded: false,
  excludedFeatureIds: new Set<number>(),
  includedFeatureIds: [] as number[],
}

export const normalizeCategoryName = (value: string | null | undefined) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const allowedCategories = new Set(MEAL_PLAN_IMAGE_CATEGORIES.map(normalizeCategoryName))

export const isMealCategoryIncluded = (meal: Meal) =>
  [meal.category?.unifiedName, meal.category?.name]
    .some(name => allowedCategories.has(normalizeCategoryName(name)))

export const selectMealPlanImageCanteens = (
  canteens: Canteen[],
  meals: Meal[],
  date: string,
): CanteenWithMeals[] => [...canteens]
  .filter(canteen => MEAL_PLAN_IMAGE_CANTEEN_IDS.includes(canteen.id))
  .sort(compareCanteens)
  .map(canteen => ({
    ...canteen,
    mealsForSelectedDay: filterMealsForDay(meals, canteen.id, date, NO_FILTERS)
      .filter(isMealCategoryIncluded)
      .sort(compareMealsByCategory),
  }))
  .filter(canteen => canteen.mealsForSelectedDay.length > 0)
