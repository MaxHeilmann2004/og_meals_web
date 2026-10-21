export const getWorkDayScopedToday = (value = new Date()) => {
  const today = new Date(value)
  const day = today.getDay()
  if (day === 6) today.setDate(today.getDate() + 2)
  else if (day === 0) today.setDate(today.getDate() + 1)
  return today
}

export const getWeekDates = (value = new Date(), weekOffset = 0) => {
  const today = getWorkDayScopedToday(value)
  today.setDate(today.getDate() + weekOffset * 7)
  const isoDayNumber = today.getDay() === 0 ? 7 : today.getDay()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - (isoDayNumber - 1))

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + index)
    return date
  })
}

export const getInitialDayIndex = (value = new Date(), weekOffset = 0) => {
  if (weekOffset !== 0) return 0
  const day = value.getDay()
  if (day === 0 || day === 6) return 0
  return day - 1
}

export const getWeekNumber = (date: Date) => {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7))
  const yearStart = Date.UTC(target.getUTCFullYear(), 0, 1)
  return Math.ceil(((target.getTime() - yearStart) / 86400000 + 1) / 7)
}

const getMonday = (value: Date) => {
  const monday = new Date(value.getFullYear(), value.getMonth(), value.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() || 7) - 1))
  return monday
}

export const getWeeksFromCurrentWeek = (weekStart: Date, now = new Date()) =>
  Math.round((getMonday(weekStart).getTime() - getMonday(now).getTime()) / (7 * 86400000))

const rangeFormatter = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' })

export const formatWeekRange = (dates: Date[]) =>
  `${rangeFormatter.format(dates[0]!)} – ${rangeFormatter.format(dates[dates.length - 1]!)}`

export const getWeekRelativeLabel = (weekStart: Date, now = new Date()) => {
  const weeks = getWeeksFromCurrentWeek(weekStart, now)
  if (weeks === 0) return 'Aktuelle Woche'
  if (weeks === 1) return 'Nächste Woche'
  return `KW ${getWeekNumber(weekStart)}`
}
