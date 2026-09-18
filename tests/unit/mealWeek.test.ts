import { describe, expect, it } from 'vitest'
import { getInitialDayIndex, getWeekDates, getWorkDayScopedToday } from '~/utils/mealWeek'

describe('meal week utilities', () => {
  it('moves weekend dates to the following Monday', () => {
    expect(getWorkDayScopedToday(new Date('2025-01-04T12:00:00')).getDay()).toBe(1)
    expect(getWorkDayScopedToday(new Date('2025-01-05T12:00:00')).getDay()).toBe(1)
  })

  it('returns the Monday-to-Friday dates for a work week', () => {
    const dates = getWeekDates(new Date('2025-01-08T12:00:00'))
    expect(dates.map(date => date.getDate())).toEqual([6, 7, 8, 9, 10])
  })

  it('selects Monday on weekends and the matching weekday during the week', () => {
    expect(getInitialDayIndex(new Date('2025-01-05T12:00:00'))).toBe(0)
    expect(getInitialDayIndex(new Date('2025-01-08T12:00:00'))).toBe(2)
  })
})
