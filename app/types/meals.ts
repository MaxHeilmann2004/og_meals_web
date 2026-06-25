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
}

export interface MealReviewStats {
  totalReviews: number
  averageStars: number
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

export interface MealReviewItem {
  id: number
  star: number
  comment: string
  createdAt: string
  mealId: number
  isFromOriginalMeal: boolean
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface PaginatedMealReviewsResponse {
  reviews: MealReviewItem[]
  pagination: Pagination
  stats: MealReviewStats
}
