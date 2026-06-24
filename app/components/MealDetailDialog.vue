<template>
  <var-popup
    :show="show"
    position="center"
    :safe-area="isMobile"
    :safe-area-top="isMobile"
    :close-on-click-overlay="true"
    @update:show="emit('update:show', $event)"
  >
    <section
      v-if="meal && canteen"
      class="meal-detail-dialog"
      :class="{ 'is-mobile': isMobile }"
      role="dialog"
      aria-modal="true"
      :aria-label="`${cleanedTitle} Details`"
    >
      <div class="dialog-scroll">
        <div class="hero-media">
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

          <!-- Circular Close Button overlaying the image/media -->
          <button class="dialog-close-btn" @click="emit('update:show', false)" aria-label="Schließen">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="dialog-content">
          <div class="meal-heading">
            <h2 class="meal-title">{{ cleanedTitle }}</h2>
            <p class="canteen-name">{{ canteen.displayName || canteen.name }}</p>
          </div>

          <div class="price-display">
            <span class="main-price">{{ formatPrice(showStudentPrice ? meal.studentPrice : meal.price) }}</span>
            <span v-if="showStudentPrice" class="regular-price-muted">Regulär: {{ formatPrice(meal.price) }}</span>
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
          </div>

          <var-collapse v-model="openSections" :offset="false" :divider="false" :elevation="false" class="detail-collapse">
            <var-collapse-item name="nutrition" title="Nährwerte">
              <div class="nutrition-panel">
                <table class="nutrition-table">
                  <tbody>
                    <tr>
                      <th>Energie</th>
                      <td>{{ energyValue }}</td>
                    </tr>
                    <tr>
                      <th>Fett</th>
                      <td>{{ formatNutrient(meal.nutritionalInfo?.fat, 'g') }}</td>
                    </tr>
                    <tr>
                      <th>davon gesättigte Fettsäuren</th>
                      <td>{{ formatNutrient(meal.nutritionalInfo?.saturatedFat, 'g') }}</td>
                    </tr>
                    <tr>
                      <th>Kohlenhydrate</th>
                      <td>{{ formatNutrient(meal.nutritionalInfo?.carbohydrates, 'g') }}</td>
                    </tr>
                    <tr>
                      <th>davon Zucker</th>
                      <td>{{ formatNutrient(meal.nutritionalInfo?.sugar, 'g') }}</td>
                    </tr>
                    <tr>
                      <th>Eiweiß</th>
                      <td>{{ formatNutrient(meal.nutritionalInfo?.protein, 'g') }}</td>
                    </tr>
                    <tr>
                      <th>Salz</th>
                      <td>{{ formatNutrient(meal.nutritionalInfo?.salt, 'g') }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </var-collapse-item>

            <var-collapse-item name="allergens" title="Allergene">
              <div v-if="meal.allergens?.length" class="chip-list">
                <div
                  v-for="allergen in meal.allergens"
                  :key="allergen.id"
                  class="detail-chip allergen-chip"
                >
                  <span class="chip-leading allergen-leading">{{ allergen.shortName || '?' }}</span>
                  <span class="chip-label">{{ prettifyAllergenName(allergen.name, allergen.shortName) }}</span>
                </div>
              </div>
              <p v-else class="empty-copy">Keine Allergene angegeben.</p>
            </var-collapse-item>

            <var-collapse-item name="features" title="Merkmale">
              <div v-if="meal.features?.length" class="chip-list">
                <div
                  v-for="feature in sortedFeatures"
                  :key="feature.id"
                  class="detail-chip feature-chip"
                  :style="featureChipStyle(feature)"
                >
                  <span v-if="getFeatureIconUrl(feature)" class="chip-leading feature-leading">
                    <span class="feature-icon-mask" :style="featureMaskStyle(feature)"></span>
                  </span>
                  <span v-else class="chip-leading feature-leading text-fallback">{{ feature.shortName || '?' }}</span>
                  <span class="chip-label">{{ feature.name || feature.shortName || 'Merkmal' }}</span>
                </div>
              </div>
              <p v-else class="empty-copy">Keine Merkmale angegeben.</p>
            </var-collapse-item>
          </var-collapse>
        </div>
      </div>
    </section>
  </var-popup>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Canteen, Meal, MealFeature } from '~/types/meals'
import { useFilterStore } from '~/stores/filters'
import { getFeatureColor, getFeatureIconUrl } from '~/utils/mealFeatures'

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

watch(() => props.show, (show) => {
  if (show) {
    openSections.value = []
  }
})

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

const energyValue = computed(() => {
  const info = meal.value?.nutritionalInfo
  if (!info) return 'Keine Angaben'
  const kj = info.kj == null ? 'n. a.' : `${formatNumber(info.kj, 0)} kJ`
  const kcal = info.kcal == null ? 'n. a.' : `${formatNumber(info.kcal, 0)} kcal`
  return `${kj} / ${kcal}`
})

const sortedFeatures = computed(() => {
  if (!meal.value?.features) return []
  return [...meal.value.features].sort((left, right) => {
    const leftOrder = left.orderInApp ?? Number.MAX_SAFE_INTEGER
    const rightOrder = right.orderInApp ?? Number.MAX_SAFE_INTEGER
    return leftOrder - rightOrder || left.id - right.id
  })
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

const formatNutrient = (value: number | null | undefined, unit: string) => {
  if (value == null) return 'n. a.'
  return `${formatNumber(value)} ${unit}`
}

const prettifyAllergenName = (name?: string | null, shortName?: string | null) => {
  if (!name) return shortName || 'Allergen'
  const normalized = name.toLowerCase().replace(/\s*\(inkl\.\s*laktose\)/i, '')
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const featureChipStyle = (feature: MealFeature) => ({
  '--feature-chip-color': getFeatureColor(feature),
})

const featureMaskStyle = (feature: MealFeature) => ({
  backgroundColor: getFeatureColor(feature),
  maskImage: `url(${getFeatureIconUrl(feature)})`,
  webkitMaskImage: `url(${getFeatureIconUrl(feature)})`,
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
  width: min(560px, calc(100vw - 32px));
  max-height: min(820px, calc(100dvh - 32px));
  border-radius: 32px;
  background: var(--color-surface-container-low);
  color: var(--color-on-surface);
  overflow: hidden;
  transform: translateZ(0); /* Fix rounded corner clipping bug */
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
}

.meal-detail-dialog.is-mobile {
  width: 100vw;
  height: 100dvh;
  max-height: 100dvh;
  border-radius: 0;
}

.dialog-scroll {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  border-radius: inherit; /* Inherit border-radius to clip inner scrolls */
}

.hero-media {
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: var(--color-surface-container-low); /* Match the dialog background */
  position: relative;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  overflow: hidden;
  transform: translateZ(0); /* Force layer for clipping */
}

@media (max-width: 767px) {
  .hero-media {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
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
  top: 16px;
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
  padding: 24px 20px 32px;
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

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.detail-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 8px 14px 8px 8px;
  border-radius: 999px;
}

.allergen-chip {
  background: var(--color-surface-container-high);
  color: var(--color-on-surface);
}

.feature-chip {
  background: color-mix(in srgb, var(--feature-chip-color) 14%, var(--color-surface));
  color: var(--color-on-surface);
  border: 1px solid color-mix(in srgb, var(--feature-chip-color) 30%, transparent);
}

.chip-leading {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  flex-shrink: 0;
}

.allergen-leading {
  background: var(--color-primary-container);
  color: var(--color-on-primary-container);
  font-size: 0.75rem;
  font-weight: 800;
}

.feature-leading {
  background: rgba(255, 255, 255, 0.72);
}

.feature-icon-mask {
  width: 14px;
  height: 14px;
  display: inline-block;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
}

.text-fallback {
  font-size: 0.72rem;
  font-weight: 800;
}

.chip-label {
  font-size: 0.9rem;
  font-weight: 600;
}

.empty-copy {
  margin: 8px 0 0 0;
  color: var(--color-on-surface-variant);
}

@media (max-width: 767px) {
  .dialog-content {
    padding: 20px 16px 32px;
  }
}
</style>