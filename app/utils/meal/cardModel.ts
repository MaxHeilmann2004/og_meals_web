import type { Meal, MealFeature } from '~/types'
import { cleanMealTitle, getMealCategoryName } from '~/utils/meal/formatters'

export type StarState = 'full' | 'half' | 'empty'

export const getStarState = (averageStars: number, position: number): StarState => {
  if (position <= Math.floor(averageStars)) return 'full'
  if (position === Math.ceil(averageStars) && averageStars % 1 >= 0.5) return 'half'
  return 'empty'
}

/** Features shown on the card overview (matches the Compose app behaviour). */
export const getOverviewFeatures = (meal: Pick<Meal, 'features'>): MealFeature[] =>
  meal.features?.filter(feature => feature.showInOverview === true) ?? []

export const getMealCardModel = (meal: Meal, canteenName: string) => ({
  title: cleanMealTitle(meal.title),
  categoryName: getMealCategoryName(meal, canteenName),
  imageUrl: meal.images[0]?.url ?? null,
  aiSuggested: meal.images[0]?.aiSuggested === true,
  hasReviews: meal.reviewStats.totalReviews > 0,
  averageStars: meal.reviewStats.averageStars,
  totalReviews: meal.reviewStats.totalReviews,
  stars: [1, 2, 3, 4, 5].map(position => getStarState(meal.reviewStats.averageStars, position)),
  features: getOverviewFeatures(meal),
})
