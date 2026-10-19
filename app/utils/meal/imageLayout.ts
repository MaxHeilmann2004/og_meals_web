export const MEAL_PLAN_IMAGE_PADDING_X = 16
export const MEAL_PLAN_IMAGE_GRID_GAP = 16
export const MEAL_PLAN_IMAGE_CARD_MIN_WIDTH = 400
export const MEAL_PLAN_IMAGE_CARD_PADDING = 12

export interface MealPlanImageLayout {
  contentWidth: number
  columns: number
  cardWidth: number
  mediaWidth: number
  mediaHeight: number
}

/** Mirrors the CSS grid `repeat(auto-fill, minmax(400px, 1fr))` used on the meal plan page, without its max page width. */
export const getMealPlanImageLayout = (imageWidth: number): MealPlanImageLayout => {
  const contentWidth = imageWidth - MEAL_PLAN_IMAGE_PADDING_X * 2
  const columns = Math.max(
    1,
    Math.floor((contentWidth + MEAL_PLAN_IMAGE_GRID_GAP) / (MEAL_PLAN_IMAGE_CARD_MIN_WIDTH + MEAL_PLAN_IMAGE_GRID_GAP)),
  )
  const cardWidth = Math.floor((contentWidth - MEAL_PLAN_IMAGE_GRID_GAP * (columns - 1)) / columns)
  const mediaWidth = cardWidth - MEAL_PLAN_IMAGE_CARD_PADDING * 2
  const mediaHeight = Math.round((mediaWidth * 9) / 16)

  return { contentWidth, columns, cardWidth, mediaWidth, mediaHeight }
}
