type CanteenOrderData = {
  id: number
  orderInApp?: number | null
}

const CANTEEN_PRIORITY = new Map([
  [8, 0], // Elbe
  [2, 1], // bonprix
])

export function compareCanteens(a: CanteenOrderData, b: CanteenOrderData): number {
  const aPriority = CANTEEN_PRIORITY.get(a.id) ?? 2
  const bPriority = CANTEEN_PRIORITY.get(b.id) ?? 2

  if (aPriority !== bPriority) return aPriority - bPriority

  const aOrder = a.orderInApp ?? Number.MAX_SAFE_INTEGER
  const bOrder = b.orderInApp ?? Number.MAX_SAFE_INTEGER
  return aOrder - bOrder
}
