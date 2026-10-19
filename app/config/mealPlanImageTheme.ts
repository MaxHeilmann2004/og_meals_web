import type { MealPlanImageTheme } from './mealPlanImage'

// Satori cannot resolve CSS variables, so the values from assets/css/theme.css are mirrored here.
export interface MealPlanImageColors {
  background: string
  onSurface: string
  onSurfaceVariant: string
  primary: string
  surfaceContainerHighest: string
  placeholderOverlay: string
}

const hsl = (h: number, s: number, l: number) => {
  const saturation = s / 100
  const lightness = l / 100
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    const value = lightness - (chroma / 2) * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(value * 255)
  }
  return `rgb(${channel(0)}, ${channel(8)}, ${channel(4)})`
}

const themes: Record<MealPlanImageTheme, MealPlanImageColors> = {
  light: {
    background: hsl(300, 100, 99),
    onSurface: hsl(9, 12, 11),
    onSurfaceVariant: hsl(4, 11, 29),
    primary: hsl(352, 100, 38),
    surfaceContainerHighest: hsl(300, 10, 90),
    placeholderOverlay: 'rgba(255, 255, 255, 0.55)',
  },
  dark: {
    background: hsl(9, 12, 11),
    onSurface: hsl(8, 29, 90),
    onSurfaceVariant: hsl(7, 24, 80),
    primary: hsl(4, 100, 84),
    surfaceContainerHighest: hsl(9, 12, 22),
    placeholderOverlay: 'rgba(26, 17, 16, 0.7)',
  },
}

export const getMealPlanImageColors = (theme: MealPlanImageTheme) => themes[theme]

export const MEAL_PLAN_IMAGE_FONT_FAMILY = 'Outfit'
