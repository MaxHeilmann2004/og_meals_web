/** Feature IDs available as exclusion filters. */
export const EXCLUDE_FEATURES = [
  { id: 15, name: 'Rind', icon: '/icons/ic_mf_beef.svg' },
  { id: 16, name: 'Schwein', icon: '/icons/ic_mf_pork.svg' },
  { id: 17, name: 'Geflügel', icon: '/icons/ic_mf_chicken.svg' },
  { id: 19, name: 'Lamm', icon: '/icons/ic_mf_lamb.svg' },
  { id: 45, name: 'Wild', icon: '/icons/ic_mf_venison.svg' },
  { id: 14, name: 'Knoblauch', icon: '/icons/ic_mf_garlic.svg' },
] as const

/** Feature IDs available as inclusion filters. */
export const INCLUDE_FEATURES = [
  { id: 25, name: 'Vegetarisch', icon: '/icons/ic_mf_vegetarian.svg' },
  { id: 11, name: 'Vegan', icon: '/icons/ic_mf_vegan.svg' },
  { id: 12, name: 'Glutenfrei', icon: '/icons/ic_mf_gluten_free.svg' },
  { id: 44, name: 'Laktosefrei', icon: '/icons/ic_mf_lactose_free.svg' },
] as const

/** Upstream meal category IDs used for salad bars and prepared salads. */
export const SALAD_CATEGORY_IDS = new Set([
  235, 247, 1584, 1586, 1587, 1650, 1651, 1652, 1653, 1654, 1655, 1656, 1657,
  1670, 1671, 1672, 1673, 1682, 1683, 1684, 1685,
  1545, 1546, 1547, 1548, 1602, 1603, 1604, 1605, 1610, 1837, 1838, 1963, 1964,
  1965, 1966, 1860, 256,
  1958, 1959, 1960,
])
