import type { Canteen } from './canteen'

export interface CanteenCapacity {
  value: number
  relativePercent: number
  absolutePersons: number | null
  unitValueRelative: string
  unitValueAbsolute: string
  timestamp: string
}

export interface CanteenCapacityEntry {
  canteen: Pick<Canteen, 'id' | 'name' | 'displayName' | 'outletId'>
  capacity: CanteenCapacity | null
}

export interface CanteenCapacityPoint {
  value: number
  relativePercent: number
  absolutePersons: number | null
  timestamp: string
}

export interface CanteenCapacityPredictionPoint {
  value: number
  relativePercent: number
  absolutePersons: number | null
  time: string
  sampleCount: number
}

export interface CanteenCapacityPrediction {
  basedOnDates: string[]
  points: CanteenCapacityPredictionPoint[]
}

export interface CanteenCapacityTimeline {
  date: string
  canteen: Pick<Canteen, 'id' | 'name' | 'displayName' | 'outletId'>
  observations: CanteenCapacityPoint[]
  prediction: CanteenCapacityPrediction | null
}
