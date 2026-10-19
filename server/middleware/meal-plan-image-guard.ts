import { createError, getRequestHeader, getRequestURL } from 'h3'
import {
  mealPlanImageRenderHeader,
  mealPlanImageRenderPath,
  mealPlanImageRenderSecret,
} from '../utils/mealPlanImage/internal'

// The render page exists only for the meal plan image endpoint's in-process requests.
export default defineEventHandler((event) => {
  if (getRequestURL(event).pathname !== mealPlanImageRenderPath) return
  if (getRequestHeader(event, mealPlanImageRenderHeader) === mealPlanImageRenderSecret) return

  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
})
