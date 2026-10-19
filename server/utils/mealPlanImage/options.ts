import {
  MEAL_PLAN_IMAGE_DEFAULT_WIDTH,
  MEAL_PLAN_IMAGE_MAX_SCALE,
  MEAL_PLAN_IMAGE_MAX_WIDTH,
  MEAL_PLAN_IMAGE_MIN_WIDTH,
  type MealPlanImageTheme,
} from '../../../app/config/mealPlanImage'

export interface MealPlanImageOptions {
  date: string
  width: number
  scale: number
  theme: MealPlanImageTheme
  studentPrices: boolean
  transparent: boolean
  inline: boolean
}

export class MealPlanImageOptionsError extends Error {}

const badRequest = (message: string) => new MealPlanImageOptionsError(message)

const berlinDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Today in Berlin; weekends roll over to the following Monday like the meal plan page does. */
export const getDefaultMealPlanImageDate = (now = new Date()) => {
  const [year, month, day] = berlinDateFormat.format(now).split('-').map(Number) as [number, number, number]
  const date = new Date(Date.UTC(year, month - 1, day))
  const weekday = date.getUTCDay()
  if (weekday === 6) date.setUTCDate(date.getUTCDate() + 2)
  else if (weekday === 0) date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

const parseDate = (value: string | undefined, now: Date) => {
  if (value === undefined || value === '') return getDefaultMealPlanImageDate(now)
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw badRequest('Ungültiges Datum, erwartet wird YYYY-MM-DD.')
  }
  return value
}

const parseNumber = (value: string | undefined, name: string, min: number, max: number, fallback: number) => {
  if (value === undefined || value === '') return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw badRequest(`Ungültiger Wert für ${name}, erlaubt sind ${min}–${max}.`)
  }
  return Math.round(parsed)
}

export const parseMealPlanImageOptions = (
  query: Record<string, string | undefined>,
  now = new Date(),
): MealPlanImageOptions => {
  const theme = query.theme ?? 'light'
  if (theme !== 'light' && theme !== 'dark') throw badRequest('Ungültiges Theme, erlaubt sind light und dark.')

  return {
    date: parseDate(query.date, now),
    width: parseNumber(query.width, 'width', MEAL_PLAN_IMAGE_MIN_WIDTH, MEAL_PLAN_IMAGE_MAX_WIDTH, MEAL_PLAN_IMAGE_DEFAULT_WIDTH),
    scale: parseNumber(query.scale, 'scale', 1, MEAL_PLAN_IMAGE_MAX_SCALE, 1),
    theme,
    studentPrices: query.studentPrices === '1',
    transparent: query.transparent === '1',
    inline: query.inline === '1',
  }
}
