import type {
  CanteenCapacityPoint,
  CanteenCapacityPredictionPoint,
} from '~/types/meals'

export type CapacityStatus = 'quiet' | 'moderate' | 'busy'

const germanNumberFormatter = new Intl.NumberFormat('de-DE')
const germanTimeFormatter = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
})

export const formatCapacityPercent = (value: number) => `${Math.round(value)} %`

export const formatCapacityPersons = (value: number | null | undefined) => {
  if (value == null) return null
  return `${germanNumberFormatter.format(Math.round(value))} Personen`
}

export const formatCapacityTime = (timestamp: string) => {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return null
  return germanTimeFormatter.format(date)
}

export const formatCalendarDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getTodayCalendarDate = () => formatCalendarDate(new Date())

export const formatCapacityCalendarDate = (date: string) => {
  const calendarDate = new Date(`${date}T00:00:00`)
  if (Number.isNaN(calendarDate.getTime())) return date
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(calendarDate)
}

export const getCapacityStatus = (relativePercent: number): CapacityStatus => {
  if (relativePercent >= 70) return 'busy'
  if (relativePercent >= 40) return 'moderate'
  return 'quiet'
}

export const getCapacityStatusLabel = (status: CapacityStatus) => {
  switch (status) {
    case 'busy':
      return 'Stark ausgelastet'
    case 'moderate':
      return 'Mäßig ausgelastet'
    case 'quiet':
      return 'Wenig ausgelastet'
    default:
      return 'Auslastung'
  }
}

export const isCapacityStale = (timestamp: string, now = Date.now()) => {
  const sampledAt = new Date(timestamp).getTime()
  if (!Number.isFinite(sampledAt)) return true
  return now - sampledAt > 60 * 60 * 1000
}

/** Convert a backend UTC prediction bucket into an instant for chart positioning. */
export const predictionPointToDate = (date: string, point: CanteenCapacityPredictionPoint) => {
  const value = new Date(`${date}T${point.time}:00.000Z`)
  return Number.isNaN(value.getTime()) ? null : value
}

export const getNearestPredictionPoint = (
  date: string,
  points: CanteenCapacityPredictionPoint[],
  referenceTime = Date.now(),
) => {
  return points
    .map((point) => ({ point, date: predictionPointToDate(date, point) }))
    .filter((item): item is { point: CanteenCapacityPredictionPoint; date: Date } => item.date !== null)
    .sort((left, right) => Math.abs(left.date.getTime() - referenceTime) - Math.abs(right.date.getTime() - referenceTime))[0]?.point ?? null
}

export type CapacityChartPoint = {
  date: Date
  percent: number
  source: 'actual' | 'prediction'
  sampleCount?: number
  absolutePersons?: number | null
}

export const actualPointToChartPoint = (point: CanteenCapacityPoint): CapacityChartPoint | null => {
  const date = new Date(point.timestamp)
  if (Number.isNaN(date.getTime())) return null
  return {
    date,
    percent: point.relativePercent,
    source: 'actual',
    absolutePersons: point.absolutePersons,
  }
}

export const predictionPointToChartPoint = (
  date: string,
  point: CanteenCapacityPredictionPoint,
): CapacityChartPoint | null => {
  const pointDate = predictionPointToDate(date, point)
  if (!pointDate) return null
  return {
    date: pointDate,
    percent: point.relativePercent,
    source: 'prediction',
    sampleCount: point.sampleCount,
    absolutePersons: point.absolutePersons,
  }
}
