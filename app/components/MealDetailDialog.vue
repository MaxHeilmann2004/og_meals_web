<template>
  <var-popup
    :show="show"
    :position="isMobile ? 'bottom' : 'center'"
    :fullscreen="isMobile"
    :safe-area="false"
    :safe-area-top="false"
    :close-on-click-overlay="true"
    @update:show="emit('update:show', $event)"
    @closed="onClosed"
  >
    <section
      v-if="meal && canteen"
      class="meal-detail-dialog"
      :class="{ 'is-mobile': isMobile }"
      role="dialog"
      aria-modal="true"
      :aria-label="`${cleanedTitle} Details`"
    >
      <!-- Circular Close Button overlaying the corner, outside scroll container -->
      <button class="dialog-close-btn" @click="emit('update:show', false)" aria-label="Schließen">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div class="dialog-layout-wrapper">
        <!-- ── Left Column: Meal Details ── -->
        <div class="dialog-left-col">
          <div class="dialog-left-col-scroll">
            <div class="hero-media">
              <HorizontalCenteredHeroCarousel
                v-if="meal.images && meal.images.length > 1"
                :images="carouselImages"
                :content-description="meal.title"
                badge-position="bottom-right"
              />
              <div v-else-if="meal.images && meal.images.length === 1" class="single-image-wrapper">
                <MealImage
                  :meal-image="meal.images[0]!"
                  :content-description="meal.title"
                  badge-position="bottom-right"
                />
              </div>
              <div v-else class="empty-image-placeholder">
                <img src="/meal_placeholder.png" alt="No image" class="placeholder-bg" />
                <div class="placeholder-overlay">
                  <span>Kein Bild verfügbar</span>
                </div>
              </div>
            </div>

            <div class="dialog-content">
              <div class="meal-heading">
                <h2 class="meal-title">{{ cleanedTitle }}</h2>
                <p class="canteen-name">{{ canteen.displayName || canteen.name }}</p>
              </div>

              <div class="price-display">
                <span class="main-price">{{ formatPrice(showStudentPrice ? meal.studentPrice : meal.price) }}</span>
                <span v-if="showStudentPrice" class="regular-price-muted">{{ formatPrice(meal.price) }}</span>
              </div>

              <div class="info-meta-row">
                <div class="info-meta-item">
                  <svg class="info-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>{{ shortDateStr }}</span>
                </div>
                <div v-if="sustainabilityTextShort" class="info-meta-item">
                  <svg class="info-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.2 0 8.8A7 7 0 0 1 11 20z"></path>
                    <path d="M19 2c-2.26 4.33-5.27 7.14-8 10"></path>
                  </svg>
                  <span>{{ sustainabilityTextShort }}</span>
                </div>
                <div class="info-meta-item">
                  <svg class="info-icon star-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <span>{{ reviewStatsSummary }}</span>
                </div>
              </div>

              <var-collapse v-model="openSections" :offset="false" :divider="false" :elevation="false" class="detail-collapse">
                <var-collapse-item name="nutrition" title="Nährwerte">
                  <MealNutritionTable :nutritional-info="meal.nutritionalInfo" />
                </var-collapse-item>

                <var-collapse-item name="allergens" title="Allergene">
                  <MealAllergensList :allergens="meal.allergens" />
                </var-collapse-item>

                <var-collapse-item name="features" title="Merkmale">
                  <MealFeaturesList :features="meal.features" />
                </var-collapse-item>

                <var-collapse-item v-if="isMobile" name="reviews" :title="`Bewertungen (${meal.reviewStats?.totalReviews ?? 0})`">
                  <MealReviewsSection
                    :meal-id="meal.id"
                    :show="show"
                    :is-mobile="true"
                    @stats-updated="updateReviewStats"
                  />
                </var-collapse-item>
              </var-collapse>
            </div>
          </div>
        </div>

        <!-- ── Right Column: Reviews (Desktop Only) ── -->
        <div v-if="!isMobile" class="dialog-right-col">
          <MealReviewsSection
            :meal-id="meal.id"
            :show="show"
            :is-mobile="false"
            @stats-updated="updateReviewStats"
          />
        </div>
      </div>
    </section>
  </var-popup>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import type { Canteen, Meal, MealReviewStats } from '~/types/meals'
import { useFilterStore } from '~/stores/filters'
import MealNutritionTable from './MealNutritionTable.vue'
import MealAllergensList from './MealAllergensList.vue'
import MealFeaturesList from './MealFeaturesList.vue'
import MealReviewsSection from './MealReviewsSection.vue'

const props = defineProps<{
  show: boolean
  meal: Meal | null
  canteen: Canteen | null
  isMobile: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const filterStore = useFilterStore()
const openSections = ref<string[]>([])

// Local copies to prevent component crashes on close animation when parent sets props to null
const localMeal = ref<Meal | null>(null)
const localCanteen = ref<Canteen | null>(null)

watch(() => props.meal, (newMeal) => {
  if (newMeal) {
    localMeal.value = newMeal
  }
}, { immediate: true })

watch(() => props.canteen, (newCanteen) => {
  if (newCanteen) {
    localCanteen.value = newCanteen
  }
}, { immediate: true })

const meal = computed(() => localMeal.value)
const canteen = computed(() => localCanteen.value)

const showStudentPrice = computed(() => filterStore.showStudentPrices && !!meal.value?.studentPrice)

const carouselImages = computed(() => {
  if (!meal.value?.images) return []
  return meal.value.images.map((img, idx) => ({
    ...img,
    aiSuggested: idx === 0 ? true : img.aiSuggested,
  }))
})

const cleanedTitle = computed(() => {
  if (!meal.value?.title) return ''
  return meal.value.title
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join(', ')
})

const shortDateStr = computed(() => {
  if (!meal.value?.date) return ''
  const d = new Date(meal.value.date)
  const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  const weekday = weekdays[d.getDay()]
  const day = d.getDate()
  const month = d.getMonth() + 1
  return `${weekday} ${day}.${month}`
})

const sustainabilityTextShort = computed(() => {
  const co2 = meal.value?.sustainabilityCo2
  if (co2 == null) return null
  if (co2 < 2.0) {
    return `${Math.round(co2 * 1000)}g CO₂`
  } else {
    return `${Math.round(co2)}g CO₂`
  }
})

const reviewStatsSummary = computed(() => {
  const stats = localMeal.value?.reviewStats
  if (!stats || stats.totalReviews === 0) return 'Keine Bewertungen'
  return `${formatNumber(stats.averageStars, 1)} (${stats.totalReviews})`
})

const formatPrice = (price: number | null | undefined) => {
  if (price == null) return ''
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

const formatNumber = (value: number, digits = 2) =>
  new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)

const updateReviewStats = (stats: MealReviewStats) => {
  if (localMeal.value) {
    localMeal.value.reviewStats = stats
  }
}

const onClosed = () => {
  localMeal.value = null
  localCanteen.value = null
  openSections.value = []
}

const handlePopState = (event: PopStateEvent) => {
  emit('update:show', false)
}

watch(() => props.show, (show) => {
  if (show && props.meal) {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePopState)
      history.pushState({ dialogOpen: true }, '')
    }
    openSections.value = []
  } else {
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', handlePopState)
      if (history.state?.dialogOpen) {
        history.back()
      }
    }
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('popstate', handlePopState)
    if (history.state?.dialogOpen) {
      history.back()
    }
  }
})
</script>

<style scoped>
/* Style Varlet's popup container directly to ensure rounded corners clip properly */
:deep(.var-popup__content) {
  background: transparent !important;
  box-shadow: none !important;
  border-radius: 32px !important;
  overflow: hidden !important;
  transform: translateZ(0); /* Fix rounded corner clipping bug */
}

@media (max-width: 767px) {
  :deep(.var-popup__content) {
    border-radius: 0 !important;
  }
}

:deep(.meal-image-wrapper) {
  background-color: transparent !important;
}

.meal-detail-dialog {
  width: min(960px, calc(100vw - 32px));
  height: min(820px, calc(100dvh - 32px));
  background: transparent !important;
  box-shadow: none !important;
  overflow: visible !important;
  display: flex;
  flex-direction: column;
  position: relative; /* Contain the absolute positioned close button */
}

.meal-detail-dialog.is-mobile {
  width: 100%;
  height: 100%;
  height: 100dvh;
  max-height: none;
  border-radius: 0;
  background: var(--color-surface-container-low) !important;
}

/* Dual Column Layout Wrapper */
.dialog-layout-wrapper {
  display: flex;
  flex-direction: row;
  gap: 16px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 767px) {
  .dialog-layout-wrapper {
    flex-direction: column;
    overflow-y: auto;
    overflow-y: overlay; /* Floating scrollbar */
    overscroll-behavior-y: contain;
    height: 100%;
    gap: 0;
  }
}

/* Left Column: Meal Details Card. */
.dialog-left-col {
  flex: 0 0 calc(57% - 8px); /* Fixed width — never shrinks/grows */
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--color-surface-container-low);
  border-radius: 32px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  border: 1px solid var(--color-outline-variant);
  position: relative;
  transform: translateZ(0); /* For corner clipping */
}

/* The actual scrollable layer. */
.dialog-left-col-scroll {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  background: var(--color-surface-container-low);
  display: flex;
  flex-direction: column;
}

@media (max-width: 767px) {
  .dialog-left-col {
    flex: none;
    height: auto;
    overflow: visible;
    border-right: none;
    background: transparent;
    border-radius: 0;
    box-shadow: none;
    border: none;
  }
  .dialog-left-col-scroll {
    flex: none;
    height: auto;
    overflow: visible;
    background: transparent;
  }
}

/* Right Column: Reviews Floating Column */
.dialog-right-col {
  flex: 1;
  min-width: 0; /* Prevent flex overflow from long content */
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  overflow-y: overlay; /* Floating scrollbar */
  background: transparent;
}

@media (max-width: 767px) {
  .dialog-right-col {
    flex: none;
    height: auto;
    overflow: visible;
    background: transparent;
  }
}

.hero-media {
  width: 100%;
  aspect-ratio: 16 / 9;
  flex-shrink: 0; /* Never let flex compress the image when collapsibles expand */
  background-color: var(--color-surface-container-low);
  position: relative;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  overflow: hidden;
  transform: translateZ(0); /* Force layer for clipping */
}

/* Match the carousel items' top corners to the dialog's 32px radius. */
.hero-media :deep(.carousel-item) {
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
}

.hero-media :deep(.carousel-item:first-child) {
  border-top-left-radius: 0;
}
.hero-media :deep(.carousel-item:last-child) {
  border-top-right-radius: 0;
}

/* Single-image wrapper fills the hero-media */
.single-image-wrapper :deep(.meal-image-wrapper) {
  border-radius: 0;
}

@media (max-width: 767px) {
  .hero-media {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  .hero-media :deep(.carousel-item),
  .hero-media :deep(.carousel-item:first-child),
  .hero-media :deep(.carousel-item:last-child) {
    border-radius: 28px;
  }
}

.single-image-wrapper,
.empty-image-placeholder {
  position: absolute;
  inset: 0;
}

.placeholder-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-overlay {
  position: absolute;
  inset: 0;
  background: rgba(26, 17, 16, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-overlay span {
  color: var(--color-on-surface-variant);
  font-size: 0.95rem;
  font-weight: 600;
}

.dialog-close-btn {
  position: absolute;
  top: calc(16px + env(safe-area-inset-top, 0px));
  left: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  border: none;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  transition: background 0.2s ease, transform 0.2s ease;
}

.dialog-close-btn:hover {
  background: rgba(0, 0, 0, 0.6);
  transform: scale(1.05);
}

.dialog-close-btn:active {
  transform: scale(0.95);
}

.dialog-content {
  padding: 24px 20px calc(32px + env(safe-area-inset-bottom, 0px));
}

.meal-heading {
  display: flex;
  flex-direction: column;
}

.meal-title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--color-on-surface);
}

.canteen-name {
  font-size: 1rem;
  color: var(--color-primary);
  font-weight: 500;
  margin: 4px 0 0 0;
}

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

.info-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  color: var(--color-on-surface-variant);
  font-size: 0.9rem;
  font-weight: 500;
}

.info-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-icon {
  opacity: 0.8;
  flex-shrink: 0;
}

.star-icon {
  color: #f59e0b;
  fill: #f59e0b;
}

.detail-collapse {
  margin-top: 24px;
  background: transparent;
}

:deep(.detail-collapse .var-collapse-item) {
  background: transparent !important;
  border: none !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 0 !important;
  margin-top: 0 !important;
}

:deep(.detail-collapse .var-collapse-item__header) {
  padding: 20px 0 !important;
  font-size: 1.1rem !important;
  font-weight: 500 !important;
  color: var(--color-on-surface) !important;
}

:deep(.detail-collapse .var-collapse-item__content) {
  padding: 0 0 20px 0 !important;
}

@media (max-width: 767px) {
  .dialog-content {
    padding: 20px 16px calc(24px + env(safe-area-inset-bottom, 0px));
  }
}
</style>