import { describe, expect, it } from 'vitest'
import { getInitialDayIndex, getWeekDates, getWeekNumber, getWeekRelativeLabel, getWorkDayScopedToday } from '~/utils/meal/week'

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

  it('shifts the week by the given offset', () => {
    const now = new Date('2025-01-08T12:00:00')
    expect(getWeekDates(now, 1).map(date => date.getDate())).toEqual([13, 14, 15, 16, 17])
    expect(getWeekDates(new Date('2025-01-05T12:00:00'), 1).map(date => date.getDate())).toEqual([13, 14, 15, 16, 17])
  })

  it('selects Monday for other weeks', () => {
    expect(getInitialDayIndex(new Date('2025-01-08T12:00:00'), 1)).toBe(0)
  })

  it('labels weeks relative to the current week', () => {
    const now = new Date('2025-01-08T12:00:00')
    expect(getWeekRelativeLabel(getWeekDates(now, 0)[0]!, now)).toBe('Aktuelle Woche')
    expect(getWeekRelativeLabel(getWeekDates(now, 1)[0]!, now)).toBe('Nächste Woche')
    expect(getWeekRelativeLabel(getWeekDates(now, 2)[0]!, now)).toBe('KW 4')
  })

  it('calculates ISO week numbers', () => {
    expect(getWeekNumber(new Date('2025-01-06T12:00:00'))).toBe(2)
    expect(getWeekNumber(new Date('2024-12-30T12:00:00'))).toBe(1)
  })
})
