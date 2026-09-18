import { describe, expect, it } from 'vitest'
import {
  actualPointToChartPoint,
  formatCapacityCalendarDate,
  formatCapacityPercent,
  formatCapacityPersons,
  formatCapacityTime,
  getCapacityStatus,
  getNearestPredictionPoint,
  isCapacityStale,
  predictionPointToDate,
} from '~/utils/capacity/capacity'

describe('canteen capacity utilities', () => {
  it('formats percentages and person counts for the German UI', () => {
    expect(formatCapacityPercent(61.6)).toBe('62 %')
    expect(formatCapacityPersons(1234.4)).toBe('1.234 Personen')
    expect(formatCapacityPersons(null)).toBeNull()
  })

  it('formats valid times and rejects invalid timestamps', () => {
    const timestamp = '2025-01-06T13:45:00.000Z'
    const expectedTime = new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp))
    expect(formatCapacityTime(timestamp)).toBe(expectedTime)
    expect(formatCapacityTime('not-a-date')).toBeNull()
    expect(formatCapacityCalendarDate('2025-01-06')).toMatch(/Montag/)
  })

  it('classifies capacity using the current thresholds', () => {
    expect(getCapacityStatus(39.9)).toBe('quiet')
    expect(getCapacityStatus(40)).toBe('moderate')
    expect(getCapacityStatus(69.9)).toBe('moderate')
    expect(getCapacityStatus(70)).toBe('busy')
  })

  it('detects stale capacity data relative to a supplied clock', () => {
    const now = Date.parse('2025-01-06T13:00:00.000Z')
    expect(isCapacityStale('2025-01-06T12:30:00.000Z', now)).toBe(false)
    expect(isCapacityStale('2025-01-06T11:59:59.000Z', now)).toBe(true)
    expect(isCapacityStale('invalid', now)).toBe(true)
  })

  it('converts prediction points into chart dates', () => {
    const point = {
      value: 0.5,
      relativePercent: 50,
      absolutePersons: 250,
      time: '12:30',
      sampleCount: 3,
    }

    expect(predictionPointToDate('2025-01-06', point)?.toISOString()).toBe('2025-01-06T12:30:00.000Z')
    expect(predictionPointToDate('invalid', point)).toBeNull()
  })

  it('selects the prediction point nearest to the reference time', () => {
    const points = [
      { value: 0.4, relativePercent: 40, absolutePersons: 200, time: '11:00', sampleCount: 2 },
      { value: 0.7, relativePercent: 70, absolutePersons: 350, time: '13:00', sampleCount: 2 },
    ]

    expect(getNearestPredictionPoint('2025-01-06', points, Date.parse('2025-01-06T12:40:00.000Z'))).toEqual(points[1])
  })

  it('maps actual observations into chart points', () => {
    expect(actualPointToChartPoint({
      value: 0.5,
      relativePercent: 50,
      absolutePersons: 250,
      timestamp: '2025-01-06T12:00:00.000Z',
    })).toMatchObject({
      percent: 50,
      source: 'actual',
      absolutePersons: 250,
    })

    expect(actualPointToChartPoint({
      value: 0.5,
      relativePercent: 50,
      absolutePersons: null,
      timestamp: 'invalid',
    })).toBeNull()
  })
})
