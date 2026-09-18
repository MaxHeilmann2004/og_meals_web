<template>
  <div class="meal-detail-summary">
    <div class="meal-heading">
      <h2 class="meal-title">{{ cleanedTitle }}</h2>
      <p class="meal-context">
        <span>{{ canteen.displayName || canteen.name }}</span>
        <span v-if="categoryName" class="meal-context-separator" aria-hidden="true">·</span>
        <span v-if="categoryName">{{ categoryName }}</span>
      </p>
    </div>

    <div class="price-display">
      <span class="main-price">{{ formatPrice(showStudentPrice ? meal.studentPrice : meal.price) }}</span>
      <span v-if="showStudentPrice" class="regular-price-muted">{{ formatPrice(meal.price) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Canteen, Meal } from '~/types'
import { cleanMealTitle, formatPrice, getMealCategoryName } from '~/utils/formatters'

const props = defineProps<{
  meal: Meal
  canteen: Canteen
  showStudentPrice: boolean
}>()

const cleanedTitle = computed(() => cleanMealTitle(props.meal.title))
const categoryName = computed(() => getMealCategoryName(props.meal))
</script>

<style scoped>
.meal-heading { display: flex; flex-direction: column; }

.meal-title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--color-on-surface);
}

.meal-context {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.4em;
  margin: 4px 0 0;
  font-size: 1rem;
  color: var(--color-primary);
  font-weight: 500;
}

.meal-context-separator { color: var(--color-outline); }

.price-display {
  margin-top: 16px;
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.main-price {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-on-surface);
}

.regular-price-muted {
  font-size: 0.95rem;
  color: var(--color-on-surface-variant);
  opacity: 0.7;
  text-decoration: line-through;
}
</style>
