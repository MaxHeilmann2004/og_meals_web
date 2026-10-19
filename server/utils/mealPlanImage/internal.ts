import { randomUUID } from 'node:crypto'

export const mealPlanImageRenderPath = '/__image/meal-plan'
export const mealPlanImageRenderHeader = 'x-meal-plan-image-render'

// Only requests issued by the image endpoint itself know this per-process secret.
export const mealPlanImageRenderSecret = randomUUID()
