import type { MealReviewStats } from '~/types/meals'

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
})

export const formatPrice = (value: number | null | undefined) =>
  value == null ? '' : currencyFormatter.format(value)

export const formatNumber = (value: number, digits = 2) =>
  new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)

export const cleanMealTitle = (title: string | null | undefined) =>
  title?.trim()
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join(', ') ?? ''

export const getMealCategoryName = (
  meal: { category?: { name?: string | null; unifiedName?: string | null } | null },
  fallback = '',
) => meal.category?.unifiedName?.trim()
  || meal.category?.name?.trim()
  || fallback

export const formatMealShortDate = (value: string | null | undefined) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  return `${weekdays[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}`
}

export const formatReviewStats = (stats: MealReviewStats | null | undefined) => {
  if (!stats || stats.totalReviews === 0) return 'Keine Bewertungen'
  return `${formatNumber(stats.averageStars, 1)} (${stats.totalReviews})`
}

export const formatRelativeDate = (dateValue: string, now = new Date()) => {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Gerade eben'
  if (diffMins < 60) return `Vor ${diffMins} Min.`
  if (diffHours < 24) return `Vor ${diffHours} Std.`
  if (diffDays === 1) return 'Gestern'
  if (diffDays < 7) return `Vor ${diffDays} Tagen`

  return date.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}
