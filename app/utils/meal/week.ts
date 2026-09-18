export const getWorkDayScopedToday = (value = new Date()) => {
  const today = new Date(value)
  const day = today.getDay()
  if (day === 6) today.setDate(today.getDate() + 2)
  else if (day === 0) today.setDate(today.getDate() + 1)
  return today
}

export const getWeekDates = (value = new Date()) => {
  const today = getWorkDayScopedToday(value)
  const isoDayNumber = today.getDay() === 0 ? 7 : today.getDay()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - (isoDayNumber - 1))

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + index)
    return date
  })
}

export const getInitialDayIndex = (value = new Date()) => {
  const day = value.getDay()
  if (day === 0 || day === 6) return 0
  return day - 1
}
