type MealCategoryOrderData = {
  category?: {
    id: number
  } | null
}

/**
 * Category order observed in the canteen API.
 *
 * Equivalent categories from different canteens are grouped together. Since
 * those IDs never compete within one canteen, their order inside a group is
 * irrelevant. Unknown categories deliberately retain their API order.
 */
const CATEGORY_ORDER_GROUPS: readonly (readonly number[])[] = [
  // Main courses: house classics and daily specials
  [201, 1490, 259], // The Original, Heimatküche, Spezial des Tages
  // Plant-focused main courses
  [1483, 249], // F&T Vegan Elbe, bonprix Vital
  // Grill main courses, with the vegan grill option directly afterwards
  [204, 1676],
  [1535, 1681],
  // Other main-course counters
  [250], // Live Counter
  [242], // Pasta
  [243], // Pizza

  // Soups
  [233, 248, 1582, 1606],

  // Salad and bistro toppings appear before their salads
  [1585, 1658, 1674],
  [1589, 1659, 1675],
  [1591],
  [1593],

  // Salad counters and individual salads
  [235, 247],
  [1650, 1654, 1670, 1682],
  [1651, 1655, 1671, 1683],
  [1652, 1656, 1672, 1684],
  [1653, 1657, 1673, 1685],
  // Bistro daily salads
  [1584],
  [1586],
  [1587],

  // Dressings
  [1958],
  [1959],
  [1960],

  // Bakery, breakfast, and desserts
  [244],
  [1856],
  [1857],
  [1858],
  [229, 246],
  [1540],
  [1541],
  [1542],
]

const CATEGORY_PRIORITY = new Map<number, number>()
CATEGORY_ORDER_GROUPS.forEach((categoryIds, priority) => {
  categoryIds.forEach(categoryId => CATEGORY_PRIORITY.set(categoryId, priority))
})

export function compareMealsByCategory(
  a: MealCategoryOrderData,
  b: MealCategoryOrderData,
): number {
  const aPriority = a.category
    ? CATEGORY_PRIORITY.get(a.category.id) ?? Number.MAX_SAFE_INTEGER
    : Number.MAX_SAFE_INTEGER
  const bPriority = b.category
    ? CATEGORY_PRIORITY.get(b.category.id) ?? Number.MAX_SAFE_INTEGER
    : Number.MAX_SAFE_INTEGER

  return aPriority - bPriority
}
