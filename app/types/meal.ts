import type { MealReviewStats } from './review'

export interface MealImageDto {
  url: string
  aiSuggested: boolean
  suggestedBasedOnMealId?: number | null
}

export interface MealFeature {
  id: number
  name?: string | null
  shortName?: string | null
  orderInApp?: number | null
  rgbColor?: string | null
  showInFilter?: boolean | null
  showInOverview?: boolean | null
}

export interface MealAllergen {
  id: number
  name?: string | null
  shortName?: string | null
}

export interface MealAdditive {
  id: number
  name?: string | null
  shortName?: string | null
}

export interface MealNutritionalInfo {
  kj: number | null
  kcal: number | null
  fat: number | null
  saturatedFat: number | null
  carbohydrates: number | null
  sugar: number | null
  protein: number | null
  salt: number | null
}

export interface MealCategory {
  id: number
  name?: string | null
  unifiedName?: string | null
}

export interface Meal {
  id: number
  plu?: string | null
  title: string
  hash?: string | null
  alternativeTitle?: string | null
  price: number | null
  studentPrice: number | null
  guestPrice?: number | null
  date: string
  sustainabilityCo2?: number | null
  canteenId: number
  nutritionalInfo?: MealNutritionalInfo | null
  allergens?: MealAllergen[]
  additives?: MealAdditive[]
  images: MealImageDto[]
  features: MealFeature[]
  category?: MealCategory | null
  reviewStats: MealReviewStats
}
