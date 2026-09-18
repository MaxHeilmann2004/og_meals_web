import type { Meal } from '~/types'
import { SALAD_CATEGORY_IDS } from '~/stores/filters'

export interface MealFilterOptions {
  isSaladExcluded: boolean
  excludedFeatureIds: ReadonlySet<number>
  includedFeatureIds: readonly number[]
}

export const matchesMealFilters = (meal: Meal, options: MealFilterOptions) => {
  if (options.isSaladExcluded && SALAD_CATEGORY_IDS.has(Number(meal.category?.id))) {
    return false
  }

  if (meal.features?.some(feature => options.excludedFeatureIds.has(feature.id))) {
    return false
  }

  return options.includedFeatureIds.every((includedId) => {
    // Vegetarian meals include vegan meals in the upstream feature model.
    if (includedId === 25) {
      return meal.features?.some(feature => feature.id === 25 || feature.id === 11) ?? false
    }
    return meal.features?.some(feature => feature.id === includedId) ?? false
  })
}

export const filterMealsForDay = (
  meals: Meal[],
  canteenId: number,
  date: string,
  options: MealFilterOptions,
) => meals.filter((meal) =>
  Number(meal.canteenId) === canteenId
  && meal.date.split('T')[0] === date
  && matchesMealFilters(meal, options),
)
