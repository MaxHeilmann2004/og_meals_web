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

export interface MealReviewStats {
  totalReviews: number
  averageStars: number
}

export interface Meal {
  id: number
  title: string
  price: number | null
  studentPrice: number | null
  guestPrice?: number | null
  date: string
  canteenId: number
  images: MealImageDto[]
  features: MealFeature[]
  reviewStats: MealReviewStats
}

export interface Canteen {
  id: number
  name: string
  displayName: string
  hash: string
  orderInApp: number
  outletId: number
  locationInfo: { id: number; name: string }
}

export interface MealsApiResponse {
  canteens: Canteen[]
  meals: Meal[]
}
