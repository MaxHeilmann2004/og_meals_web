import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/** Feature IDs available as exclusion filters */
export const EXCLUDE_FEATURES = [
  { id: 15, name: 'Rind', icon: '/icons/ic_mf_beef.svg' },
  { id: 16, name: 'Schwein', icon: '/icons/ic_mf_pork.svg' },
  { id: 17, name: 'Geflügel', icon: '/icons/ic_mf_chicken.svg' },
  { id: 19, name: 'Lamm', icon: '/icons/ic_mf_lamb.svg' },
  { id: 45, name: 'Wild', icon: '/icons/ic_mf_venison.svg' },
  { id: 14, name: 'Knoblauch', icon: '/icons/ic_mf_garlic.svg' },
] as const

export const useFilterStore = defineStore(
  'filters',
  () => {
    // --- State (persisted via pinia-plugin-persistedstate) ---
    const enabledCanteens = ref<Record<number, boolean>>({})
    const excludedFeatures = ref<Record<number, boolean>>({})
    const showStudentPrices = ref(false)

    // UI-only — not persisted
    const isFilterOpen = ref(false)

    // --- Getters ---
    const isCanteenEnabled = (id: number): boolean => {
      const val = enabledCanteens.value[id]
      if (val === undefined) {
        return id !== 4 && id !== 9
      }
      return val
    }

    const isFeatureExcluded = (id: number): boolean =>
      excludedFeatures.value[id] === true // new ids default to false

    const activeFilterCount = computed(() => {
      let count = 0
      for (const [idStr, val] of Object.entries(enabledCanteens.value)) {
        const id = Number(idStr)
        if (val === false && id !== 4 && id !== 9) count++
      }
      for (const val of Object.values(excludedFeatures.value)) {
        if (val === true) count++
      }
      if (showStudentPrices.value) count++
      return count
    })

    // --- Actions ---
    function initFromCanteens(canteens: { id: number }[]) {
      for (const c of canteens) {
        if (enabledCanteens.value[c.id] === undefined) {
          enabledCanteens.value[c.id] = c.id !== 4 && c.id !== 9
        }
      }
    }

    function toggleCanteen(id: number) {
      enabledCanteens.value[id] = !isCanteenEnabled(id)
    }

    function toggleFeatureExclusion(id: number) {
      excludedFeatures.value[id] = !isFeatureExcluded(id)
    }

    function toggleStudentPrices() {
      showStudentPrices.value = !showStudentPrices.value
    }

    function openFilters() { isFilterOpen.value = true }
    function closeFilters() { isFilterOpen.value = false }
    function toggleFilters() { isFilterOpen.value = !isFilterOpen.value }

    return {
      enabledCanteens,
      excludedFeatures,
      showStudentPrices,
      isFilterOpen,
      isCanteenEnabled,
      isFeatureExcluded,
      activeFilterCount,
      initFromCanteens,
      toggleCanteen,
      toggleFeatureExclusion,
      toggleStudentPrices,
      openFilters,
      closeFilters,
      toggleFilters,
    }
  },
  {
    // pinia-plugin-persistedstate config:
    // Only persists the three filter state refs; isFilterOpen is excluded (UI-only).
    persist: {
      key: 'og-meals-filters',
      pick: ['enabledCanteens', 'excludedFeatures', 'showStudentPrices'],
    },
  }
)
