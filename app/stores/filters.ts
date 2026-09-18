import { defineStore } from "pinia";
import { computed, ref } from "vue";
import {
  EXCLUDE_FEATURES,
  INCLUDE_FEATURES,
  SALAD_CATEGORY_IDS,
} from "~/config/featureCatalog";

export { EXCLUDE_FEATURES, INCLUDE_FEATURES, SALAD_CATEGORY_IDS } from "~/config/featureCatalog";

export const useFilterStore = defineStore(
  "filters",
  () => {
    // --- State (persisted via pinia-plugin-persistedstate) ---
    const enabledCanteens = ref<Record<number, boolean>>({});
    const excludedFeatures = ref<Record<number, boolean>>({});
    const includedFeatures = ref<Record<number, boolean>>({});
    // Hide salads for new users; persisted preferences still override this default.
    const excludeSalads = ref(true);
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
