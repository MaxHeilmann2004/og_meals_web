export interface MealReviewStats {
  totalReviews: number
  averageStars: number
}

export interface MealReviewItem {
  id: number
  star: number
  comment: string
  createdAt: string
  mealId: number
  isFromOriginalMeal: boolean
  matchType?: 'original' | 'hash' | 'similarity' | null
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
