// Canteens (by ID, see utils/canteen/order.ts) and categories included in the meal plan image.
export const MEAL_PLAN_IMAGE_CANTEEN_IDS: readonly number[] = [
  8, // Elbe
  2, // bonprix
]

export const MEAL_PLAN_IMAGE_CATEGORIES: readonly string[] = [
  'Grill',
  'The Original',
  'F&T Vegan',
  'Pasta',
  'Pizza',
  'Heimatküche',
  'Vital',
  'Live-Counter',
]

export const MEAL_PLAN_IMAGE_DEFAULT_WIDTH = 1300
export const MEAL_PLAN_IMAGE_MIN_WIDTH = 320
export const MEAL_PLAN_IMAGE_MAX_WIDTH = 2400
export const MEAL_PLAN_IMAGE_MAX_SCALE = 3

export type MealPlanImageTheme = 'light' | 'dark'
