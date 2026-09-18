import type { Canteen } from './canteen'
import type {
  CanteenCapacityEntry,
  CanteenCapacityTimeline,
} from './capacity'
import type { Meal } from './meal'

export interface MealsApiResponse {
  canteens: Canteen[]
  meals: Meal[]
}

export interface CanteenCapacityApiResponse {
  success: boolean
  data: CanteenCapacityEntry[]
}

export interface CanteenCapacityTimelineApiResponse {
  success: boolean
  data: CanteenCapacityTimeline
}
