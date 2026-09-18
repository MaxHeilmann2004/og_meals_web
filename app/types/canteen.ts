export interface CanteenSummary {
  id: number
  name: string
  displayName: string
  orderInApp: number
}

export interface Canteen extends CanteenSummary {
  hash: string
  outletId: number
  locationInfo: { id: number; name: string }
}
