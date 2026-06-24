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
      class="meal-detail-dialog"
      :class="{ 'is-mobile': isMobile }"
      role="dialog"
      aria-modal="true"
      :aria-label="`${cleanedTitle} Details`"
    >
      <header class="dialog-topbar">
        <div class="dialog-kicker">Mahlzeit Details</div>
        <var-button round text type="primary" class="close-button" @click="emit('update:show', false)">
          Schliessen
        </var-button>
      </header>

      <div class="dialog-scroll">
        <div class="hero-shell">
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
                <span>Kein Bild verfugbar</span>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-content">
          <div class="meal-heading">
            <p class="meal-day-label">{{ formattedDate }}</p>
            <h2 class="meal-title">{{ cleanedTitle }}</h2>
          </div>

          <div class="price-row">
            <div class="price-block">
              <span class="price-label">Preis</span>
              <span class="price-value">{{ formatPrice(meal.price) || 'n. a.' }}</span>
            </div>
            <div v-if="showStudentPrice" class="price-block accent">
              <span class="price-label">Studierende</span>
              <span class="price-value">{{ formatPrice(meal.studentPrice) }}</span>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <span class="meta-label">Mensa</span>
              <span class="meta-value">{{ canteen.displayName || canteen.name }}</span>
            </div>
            <div class="meta-card">
              <span class="meta-label">Tag</span>
              <span class="meta-value">{{ formattedDate }}</span>
            </div>
            <div class="meta-card meta-card-wide">
              <span class="meta-label">Nachhaltigkeit</span>
              <span class="meta-value">{{ sustainabilityText }}</span>
            </div>
          </div>

          <var-collapse v-model="openSections" :offset="false" :divider="false" :elevation="false" class="detail-collapse">
            <var-collapse-item name="nutrition" title="Nahrwerte">
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
                      <th>davon gesattigte Fettsauren</th>
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
                      <th>Eiweiss</th>
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

const meal = computed(() => props.meal)
const canteen = computed(() => props.canteen)

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

const formattedDate = computed(() => {
  if (!meal.value?.date) return ''
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(meal.value.date))
})

const sustainabilityText = computed(() => {
  const co2 = meal.value?.sustainabilityCo2
  if (co2 == null) return 'Keine Nachhaltigkeitsangabe verfugbar'
  return `${formatNumber(co2)} kg CO2e`
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
.meal-detail-dialog {
  width: min(920px, calc(100vw - 40px));
  max-height: calc(100dvh - 40px);
  border-radius: 32px;
  background:
    radial-gradient(circle at top right, rgba(145, 19, 19, 0.08), transparent 26%),
    var(--color-surface-container-low);
  color: var(--color-on-surface);
  overflow: hidden;
  box-shadow: 0 28px 80px rgba(20, 10, 10, 0.28);
  display: flex;
  flex-direction: column;
}

.meal-detail-dialog.is-mobile {
  width: 100vw;
  height: 100dvh;
  max-height: 100dvh;
  border-radius: 0;
}

.dialog-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(102, 73, 67, 0.12);
}

.dialog-kicker {
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
}

.close-button {
  flex-shrink: 0;
}

.dialog-scroll {
  overflow: auto;
}

.hero-shell {
  padding: 20px 20px 0;
}

.hero-media {
  aspect-ratio: 16 / 9;
  border-radius: 28px;
  overflow: hidden;
  background-color: var(--color-surface-container-highest);
  position: relative;
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

.dialog-content {
  padding: 24px 20px 28px;
}

.meal-heading {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meal-day-label {
  margin: 0;
  font-size: 0.95rem;
  color: var(--color-on-surface-variant);
  text-transform: capitalize;
}

.meal-title {
  margin: 0;
  font-size: clamp(1.9rem, 3vw, 2.8rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.price-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 22px;
}

.price-block {
  min-width: 160px;
  padding: 14px 16px;
  border-radius: 20px;
  background: var(--color-surface-container-high);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.price-block.accent {
  background: var(--color-primary-container);
  color: var(--color-on-primary-container);
}

.price-label {
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  opacity: 0.72;
}

.price-value {
  font-size: 1.35rem;
  font-weight: 800;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 22px;
}

.meta-card {
  padding: 16px;
  border-radius: 20px;
  background: var(--color-surface-container);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-card-wide {
  grid-column: 1 / -1;
}

.meta-label {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-on-surface-variant);
}

.meta-value {
  font-size: 1rem;
  font-weight: 600;
}

.detail-collapse {
  margin-top: 24px;
}

:deep(.detail-collapse .var-collapse-item) {
  margin-top: 12px;
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid rgba(106, 77, 73, 0.12);
  background: var(--color-surface-container-low);
}

:deep(.detail-collapse .var-collapse-item__header) {
  padding: 18px 18px 16px;
  font-weight: 700;
}

:deep(.detail-collapse .var-collapse-item__content) {
  padding: 0 18px 18px;
}

.nutrition-panel {
  border-radius: 18px;
  border: 1px solid var(--color-outline);
  overflow: hidden;
}

.nutrition-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-surface);
}

.nutrition-table th,
.nutrition-table td {
  padding: 12px 14px;
  font-size: 0.96rem;
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
  margin: 0;
  color: var(--color-on-surface-variant);
}

@media (max-width: 767px) {
  .dialog-topbar {
    padding-top: calc(16px + env(safe-area-inset-top));
  }

  .hero-shell {
    padding: 12px 12px 0;
  }

  .hero-media {
    border-radius: 24px;
  }

  .dialog-content {
    padding: 20px 12px 28px;
  }

  .meta-grid {
    grid-template-columns: 1fr;
  }

  .meta-card-wide {
    grid-column: auto;
  }
}
</style>