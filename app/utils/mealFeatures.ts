export interface MealFeatureLike {
  id: number
}

export const FEATURE_COLORS: Record<number, string> = {
  11: '#4CAF50',
  12: '#FF9800',
  14: '#AB47BC',
  15: '#8D6E63',
  16: '#EC407A',
  17: '#FF7043',
  19: '#78909C',
  25: '#66BB6A',
  44: '#42A5F5',
  45: '#6D4C41',
  48: '#26C6DA',
}

export const getFeatureIconUrl = (feature: MealFeatureLike) => {
  switch (Number(feature.id)) {
    case 11: return '/icons/ic_mf_vegan.svg'
    case 12: return '/icons/ic_mf_gluten_free.svg'
    case 14: return '/icons/ic_mf_garlic.svg'
    case 15: return '/icons/ic_mf_beef.svg'
    case 16: return '/icons/ic_mf_pork.svg'
    case 17: return '/icons/ic_mf_chicken.svg'
    case 19: return '/icons/ic_mf_lamb.svg'
    case 25: return '/icons/ic_mf_vegetarian.svg'
    case 44: return '/icons/ic_mf_lactose_free.svg'
    case 45: return '/icons/ic_mf_venison.svg'
    case 48: return '/icons/ic_mf_environment_friendly.svg'
    default: return null
  }
}

export const getFeatureColor = (feature: MealFeatureLike) =>
  FEATURE_COLORS[Number(feature.id)] ?? 'var(--color-secondary)'