<template>
  <div class="meal-card">
    <!-- Image Section -->
    <div class="meal-image-container">
      <HorizontalCenteredHeroCarousel
        v-if="meal.images && meal.images.length > 1"
        :images="carouselImages"
        :content-description="meal.title"
      />
      <div v-else-if="meal.images && meal.images.length === 1" class="single-image-wrapper">
        <MealImage
          :meal-image="meal.images[0]!"
          :content-description="meal.title"
        />
      </div>
      <div v-else class="empty-image-placeholder">
        <img src="/meal_placeholder.png" alt="No image" class="placeholder-bg" />
        <div class="placeholder-overlay">
          <span>Kein Bild verfügbar</span>
        </div>
      </div>
    </div>

    <!-- Title and Price Row -->
    <div class="meal-info-row">
      <h3 class="meal-title" :title="cleanedTitle">
        {{ cleanedTitle }}
      </h3>
      <div class="meal-prices">
        <!-- Original Price -->
        <span 
          class="price-regular" 
          :class="{ 'has-student-price': showStudentPrice }"
        >
          {{ formatPrice(meal.price) }}
        </span>
        <!-- Student Price -->
        <span v-if="showStudentPrice" class="price-student">
          {{ formatPrice(props.meal.studentPrice) }}
        </span>
      </div>
    </div>

    <!-- Canteen and Features Row -->
    <div class="meal-footer-row">
      <span class="canteen-name">{{ canteen.name }}</span>
      <div class="feature-icons">
        <MealIcon
          v-for="feature in visibleFeatures"
          :key="feature.id"
          :feature="feature"
          class="feature-icon"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFilterStore } from '~/stores/filters'

interface MealImageDto {
  url: string
  aiSuggested: boolean
}

interface MealFeature {
  id: number
  name?: string | null
  shortName?: string | null
  showInFilter?: boolean | null
}

interface Meal {
  id: number
  title: string
  price: number | null
  studentPrice: number | null
  images: MealImageDto[]
  features: MealFeature[]
}

interface Canteen {
  id: number
  name: string
}

const props = defineProps<{
  meal: Meal
  canteen: Canteen
}>()

const filterStore = useFilterStore()
const showStudentPrice = computed(() => filterStore.showStudentPrices && !!props.meal.studentPrice)

// Test simulation setting first image of sliders as AI suggested (matches native app logic)
const carouselImages = computed(() => {
  if (!props.meal.images) return []
  return props.meal.images.map((img, idx) => ({
    ...img,
    aiSuggested: idx === 0 ? true : img.aiSuggested
  }))
})

// Clean up title by removing multiple lines and extra spaces
const cleanedTitle = computed(() => {
  if (!props.meal.title) return ''
  return props.meal.title
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join(', ')
})

// Filter features that should be displayed
const visibleFeatures = computed(() => {
  if (!props.meal.features) return []
  return props.meal.features.filter(f => f.showInFilter === true)
})

// Format prices into Euro currency string
const formatPrice = (price: number | null | undefined) => {
  if (price == null) return ''
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}
</script>

<style scoped>
.meal-card {
  padding: 12px;
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface-container-low);
  border-radius: 28px;
  margin-bottom: 8px;
}

.meal-image-container {
  width: 100%;
  aspect-ratio: 16 / 9;
  position: relative;
}

.single-image-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 28px;
  overflow: hidden;
}

.empty-image-placeholder {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: var(--color-surface-container-highest);
  border-radius: 28px;
  overflow: hidden;
}

.placeholder-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(26, 17, 16, 0.7); /* Match surfaceContainer with opacity */
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-overlay span {
  color: var(--color-on-surface-variant);
  font-size: 0.875rem;
  font-weight: 500;
}

.meal-info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 12px;
  gap: 16px;
}

.meal-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-on-surface);
  margin: 0;
  line-height: 1.4;
  flex: 1;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meal-prices {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  margin-top: 2px;
}

.price-regular {
  color: var(--color-on-surface);
}

.price-regular.has-student-price {
  text-decoration: line-through;
  opacity: 0.7;
  margin-right: 8px;
  font-weight: 400;
}

.price-student {
  color: var(--color-on-surface);
  font-weight: 700;
}

.meal-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  gap: 16px;
}

.canteen-name {
  font-size: 0.875rem;
  color: var(--color-on-secondary-container);
  font-weight: 500;
  flex: 1;
}

.feature-icons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feature-icon {
  flex-shrink: 0;
}
</style>
