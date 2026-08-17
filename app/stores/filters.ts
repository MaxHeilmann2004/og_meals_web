import { defineStore } from "pinia";
import { computed, ref } from "vue";

/** Feature IDs available as exclusion filters */
export const EXCLUDE_FEATURES = [
  { id: 15, name: "Rind", icon: "/icons/ic_mf_beef.svg" },
  { id: 16, name: "Schwein", icon: "/icons/ic_mf_pork.svg" },
  { id: 17, name: "Geflügel", icon: "/icons/ic_mf_chicken.svg" },
  { id: 19, name: "Lamm", icon: "/icons/ic_mf_lamb.svg" },
  { id: 45, name: "Wild", icon: "/icons/ic_mf_venison.svg" },
  { id: 14, name: "Knoblauch", icon: "/icons/ic_mf_garlic.svg" },
] as const;

/** Feature IDs available as inclusion filters */
export const INCLUDE_FEATURES = [
  { id: 25, name: "Vegetarisch", icon: "/icons/ic_mf_vegetarian.svg" },
  { id: 11, name: "Vegan", icon: "/icons/ic_mf_vegan.svg" },
  { id: 12, name: "Glutenfrei", icon: "/icons/ic_mf_gluten_free.svg" },
  { id: 44, name: "Laktosefrei", icon: "/icons/ic_mf_lactose_free.svg" },
] as const;

/** Upstream meal category IDs used for salad bars and prepared salads. */
export const SALAD_CATEGORY_IDS = new Set([
  235, 247, 1584, 1586, 1587, 1650, 1651, 1652, 1653, 1654, 1655, 1656, 1657,
  1670, 1671, 1672, 1673, 1682, 1683, 1684, 1685,
  // Historical category aliases still present in upstream reference data.
  1545, 1546, 1547, 1548, 1602, 1603, 1604, 1605, 1610, 1837, 1838, 1963, 1964,
  1965, 1966, 1860, 256,
  // Dressing
  1958, 1959, 1960,
]);

export const useFilterStore = defineStore(
  "filters",
  () => {
    // --- State (persisted via pinia-plugin-persistedstate) ---
    const enabledCanteens = ref<Record<number, boolean>>({});
    const excludedFeatures = ref<Record<number, boolean>>({});
    const includedFeatures = ref<Record<number, boolean>>({});
    const excludeSalads = ref(false);
    const showStudentPrices = ref(false);

    // UI-only — not persisted
    const isFilterOpen = ref(false);

    // --- Getters ---
    const isCanteenEnabled = (id: number): boolean => {
      const val = enabledCanteens.value[id];
      if (val === undefined) {
        return id !== 4 && id !== 9;
      }
      return val;
    };

    const isFeatureExcluded = (id: number): boolean =>
      excludedFeatures.value[id] === true; // new ids default to false

    const isFeatureIncluded = (id: number): boolean =>
      includedFeatures.value[id] === true; // new ids default to false

    const isSaladExcluded = computed(() => excludeSalads.value);

    const activeFilterCount = computed(() => {
      let count = 0;
      for (const [idStr, val] of Object.entries(enabledCanteens.value)) {
        const id = Number(idStr);
        if (val === false && id !== 4 && id !== 9) count++;
      }
      for (const val of Object.values(excludedFeatures.value)) {
        if (val === true) count++;
      }
      for (const val of Object.values(includedFeatures.value)) {
        if (val === true) count++;
      }
      if (excludeSalads.value) count++;
      if (showStudentPrices.value) count++;
      return count;
    });

    // --- Actions ---
    function initFromCanteens(canteens: { id: number }[]) {
      for (const c of canteens) {
        if (enabledCanteens.value[c.id] === undefined) {
          enabledCanteens.value[c.id] = c.id !== 4 && c.id !== 9;
        }
      }
    }

    function toggleCanteen(id: number) {
      enabledCanteens.value[id] = !isCanteenEnabled(id);
    }

    function toggleFeatureExclusion(id: number) {
      excludedFeatures.value[id] = !isFeatureExcluded(id);
    }

    function toggleFeatureInclusion(id: number) {
      includedFeatures.value[id] = !isFeatureIncluded(id);
    }

    function toggleSaladExclusion() {
      excludeSalads.value = !excludeSalads.value;
    }

    function toggleStudentPrices() {
      showStudentPrices.value = !showStudentPrices.value;
    }

    function openFilters() {
      isFilterOpen.value = true;
    }
    function closeFilters() {
      isFilterOpen.value = false;
    }
    function toggleFilters() {
      isFilterOpen.value = !isFilterOpen.value;
    }

    return {
      enabledCanteens,
      excludedFeatures,
      includedFeatures,
      excludeSalads,
      showStudentPrices,
      isFilterOpen,
      isCanteenEnabled,
      isFeatureExcluded,
      isFeatureIncluded,
      isSaladExcluded,
      activeFilterCount,
      initFromCanteens,
      toggleCanteen,
      toggleFeatureExclusion,
      toggleFeatureInclusion,
      toggleSaladExclusion,
      toggleStudentPrices,
      openFilters,
      closeFilters,
      toggleFilters,
    };
  },
  {
    // pinia-plugin-persistedstate config:
    // Only persists the three filter state refs; isFilterOpen is excluded (UI-only).
    persist: {
      key: "og-meals-filters",
      pick: [
        "enabledCanteens",
        "excludedFeatures",
        "includedFeatures",
        "excludeSalads",
        "showStudentPrices",
      ],
    },
  },
);
