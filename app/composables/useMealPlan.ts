import { computed, ref, watch } from 'vue'
import type { Canteen, Meal, MealsApiResponse } from '~/types'
import { useFilterStore } from '~/stores/filters'
import { useCanteenStore } from '~/stores/canteens'
import { mealsApi } from '~/services/mealsApi'
import { formatCalendarDate } from '~/utils/canteenCapacity'
import { compareCanteens } from '~/utils/canteenOrder'
import { compareMealsByCategory } from '~/utils/mealOrder'
import { filterMealsForDay, type MealFilterOptions } from '~/utils/mealFiltering'
import { getInitialDayIndex, getWeekDates } from '~/utils/mealWeek'

export const useMealPlan = async () => {
  const filterStore = useFilterStore()
  const canteenStore = useCanteenStore()
  const weekDates = getWeekDates()
  const startOfWeek = formatCalendarDate(weekDates[0]!)
  const endOfWeek = formatCalendarDate(weekDates[4]!)

  const selectedDayIndex = ref(getInitialDayIndex())
  const selectedDayDateStr = computed(() => formatCalendarDate(weekDates[selectedDayIndex.value]!))

  const { data, pending, error, refresh } = await useAsyncData<MealsApiResponse>(
    'meals-week',
    () => mealsApi.getWeek(startOfWeek, endOfWeek),
  )

  const rawCanteens = computed(() => [...(data.value?.canteens ?? [])].sort(compareCanteens))
  const rawMeals = computed(() => data.value?.meals ?? [])

  watch(rawCanteens, (canteens) => {
    filterStore.initFromCanteens(canteens)
    canteenStore.setCanteens(canteens)
  }, { immediate: true })

  const mealFilterOptions = computed<MealFilterOptions>(() => ({
    isSaladExcluded: filterStore.isSaladExcluded,
    excludedFeatureIds: new Set(
      Object.entries(filterStore.excludedFeatures)
        .filter(([, enabled]) => enabled)
        .map(([id]) => Number(id)),
    ),
    includedFeatureIds: Object.entries(filterStore.includedFeatures)
      .filter(([, enabled]) => enabled)
      .map(([id]) => Number(id)),
  }))

  const filteredCanteens = computed(() => rawCanteens.value
    .filter(canteen => filterStore.isCanteenEnabled(canteen.id))
    .map(canteen => ({
      ...canteen,
      mealsForSelectedDay: filterMealsForDay(
        rawMeals.value,
        canteen.id,
        selectedDayDateStr.value,
        mealFilterOptions.value,
      ).sort(compareMealsByCategory),
    }))
    .filter(canteen => canteen.mealsForSelectedDay.length > 0))

  const totalMealsForSelectedDay = computed(() =>
    filteredCanteens.value.reduce((total, canteen) => total + canteen.mealsForSelectedDay.length, 0),
  )

  return {
    data,
    pending,
    error,
    refresh,
    rawCanteens,
    selectedDayIndex,
    selectedDayDateStr,
    filteredCanteens,
    totalMealsForSelectedDay,
  }
}
