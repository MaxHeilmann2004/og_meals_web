<template>
  <div class="nutrition-panel">
    <table class="nutrition-table">
      <tbody>
        <tr>
          <th>Energie</th>
          <td>{{ energyValue }}</td>
        </tr>
        <tr>
          <th>Fett</th>
          <td>{{ formatNutrient(nutritionalInfo?.fat, 'g') }}</td>
        </tr>
        <tr>
          <th>davon gesättigte Fettsäuren</th>
          <td>{{ formatNutrient(nutritionalInfo?.saturatedFat, 'g') }}</td>
        </tr>
        <tr>
          <th>Kohlenhydrate</th>
          <td>{{ formatNutrient(nutritionalInfo?.carbohydrates, 'g') }}</td>
        </tr>
        <tr>
          <th>davon Zucker</th>
          <td>{{ formatNutrient(nutritionalInfo?.sugar, 'g') }}</td>
        </tr>
        <tr>
          <th>Eiweiß</th>
          <td>{{ formatNutrient(nutritionalInfo?.protein, 'g') }}</td>
        </tr>
        <tr>
          <th>Salz</th>
          <td>{{ formatNutrient(nutritionalInfo?.salt, 'g') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MealNutritionalInfo } from '~/types/meals'

const props = defineProps<{
  nutritionalInfo: MealNutritionalInfo | null | undefined
}>()

const formatNumber = (value: number, digits = 2) =>
  new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)

const formatNutrient = (value: number | null | undefined, unit: string) => {
  if (value == null) return 'n. a.'
  return `${formatNumber(value)} ${unit}`
}

const energyValue = computed(() => {
  const info = props.nutritionalInfo
  if (!info) return 'Keine Angaben'
  const kj = info.kj == null ? 'n. a.' : `${formatNumber(info.kj, 0)} kJ`
  const kcal = info.kcal == null ? 'n. a.' : `${formatNumber(info.kcal, 0)} kcal`
  return `${kj} / ${kcal}`
})
</script>

<style scoped>
.nutrition-panel {
  border-radius: 18px;
  border: 1px solid var(--color-outline-variant);
  overflow: hidden;
  margin-top: 8px;
}

.nutrition-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-surface-container);
}

.nutrition-table th,
.nutrition-table td {
  padding: 12px 14px;
  font-size: 0.96rem;
  color: var(--color-on-surface);
}

.nutrition-table th {
  text-align: left;
  width: 52%;
  font-weight: 700;
  border-right: 1px solid var(--color-outline-variant);
}

.nutrition-table td {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.nutrition-table tr + tr th,
.nutrition-table tr + tr td {
  border-top: 1px solid var(--color-outline-variant);
}
</style>
