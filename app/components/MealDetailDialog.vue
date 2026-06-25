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

              <var-collapse-item v-if="isMobile" name="reviews" :title="`Bewertungen (${reviews.length})`">
                <div class="reviews-section-content" style="padding: 4px 0 0 0; gap: 16px;">
                  <!-- Add Review form -->
                  <div class="add-review-container">
                    <div class="add-review-header">
                      <h3 class="reviews-heading" style="margin: 0;">Gericht bewerten</h3>
                      <!-- Custom star input always visible - hover preview + click to expand -->
                      <div class="star-input-row">
                        <button
                          v-for="n in 5"
                          :key="n"
                          class="star-btn"
                          :class="{ filled: n <= (hoverStar > 0 ? hoverStar : newReview.star), hovered: hoverStar > 0 && n <= hoverStar }"
                          @mouseenter="hoverStar = n"
                          @mouseleave="hoverStar = 0"
                          @click="newReview.star = n"
                          :aria-label="`${n} Stern${n > 1 ? 'e' : ''}`"
                        >
                          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <Transition name="review-expand">
                      <div v-if="isReviewFormExpanded" class="add-review-body">
                        <div class="review-form-comment">
                          <var-input
                            v-model="newReview.comment"
                            textarea
                            rows="3"
                            :maxlength="500"
                            show-word-limit
                            placeholder="Schreibe eine Bewertung zum Gericht..."
                            :line="false"
                            class="custom-textarea"
                          />
                        </div>

                        <!-- Turnstile Widget (Mobile) -->
                        <div class="turnstile-outer-wrapper">
                          <div id="turnstile-container-mobile"></div>
                        </div>

                        <div class="review-form-actions">
                          <var-button
                            type="primary"
                            :disabled="isSubmitting || newReview.star === 0 || !newReview.comment.trim() || !turnstileToken"
                            :loading="isSubmitting"
                            block
                            class="submit-review-btn"
                            @click="submitReview"
                          >
                            Bewertung senden
                          </var-button>
                        </div>

                        <Transition name="fade">
                          <p v-if="submitError" class="submit-error">{{ submitError }}</p>
                        </Transition>
                        <Transition name="fade">
                          <p v-if="submitSuccess" class="submit-success">✓ Bewertung erfolgreich gesendet!</p>
                        </Transition>
                      </div>
                    </Transition>
                  </div>

                  <!-- Reviews list (Mobile) -->
                  <div class="reviews-list-container">
                    <div v-if="isReviewsLoading" class="reviews-loading">
                      <var-loading type="circle" size="small" description="Lade Bewertungen..." />
                    </div>

                    <div v-else-if="reviewsError" class="reviews-error-box">
                      <p>{{ reviewsError }}</p>
                      <var-button type="primary" size="small" @click="fetchReviews(meal.id)">Erneut versuchen</var-button>
                    </div>

                    <div v-else-if="reviews.length === 0" class="no-reviews-box">
                      <p class="empty-copy">Noch keine Bewertungen vorhanden. Schreibe die erste!</p>
                    </div>

                    <div v-else class="reviews-cards-list">
                      <div v-for="rev in reviews" :key="rev.id" class="review-card">
                        <div class="review-card-header">
                          <var-rate
                            readonly
                            :model-value="rev.star"
                            size="18"
                            color="var(--color-primary)"
                            empty-color="var(--color-outline-variant)"
                          />
                          <span class="review-card-date">{{ formatDate(rev.createdAt) }}</span>
                        </div>
                        <p class="review-card-comment">{{ rev.comment }}</p>
                        <span v-if="!rev.isFromOriginalMeal" class="propagated-tag">
                          Ähnliches Gericht
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </var-collapse-item>
            </var-collapse>
          </div>
          </div>
        </div>

        <!-- ── Right Column: Reviews (Desktop Only) ── -->
        <div v-if="!isMobile" class="dialog-right-col">
          <div class="reviews-section-content">
            <!-- Add Review form -->
            <div class="add-review-container">
              <div class="add-review-header">
                <h3 class="reviews-heading" style="margin: 0;">Gericht bewerten</h3>
                <!-- Custom star input always visible - hover preview + click to expand -->
                <div class="star-input-row">
                  <button
                    v-for="n in 5"
                    :key="n"
                    class="star-btn"
                    :class="{ filled: n <= (hoverStar > 0 ? hoverStar : newReview.star), hovered: hoverStar > 0 && n <= hoverStar }"
                    @mouseenter="hoverStar = n"
                    @mouseleave="hoverStar = 0"
                    @click="newReview.star = n"
                    :aria-label="`${n} Stern${n > 1 ? 'e' : ''}`"
                  >
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <Transition name="review-expand">
                <div v-if="isReviewFormExpanded" class="add-review-body">
                  <div class="review-form-comment">
                    <var-input
                      v-model="newReview.comment"
                      textarea
                      rows="3"
                      :maxlength="500"
                      show-word-limit
                      placeholder="Schreibe eine Bewertung zum Gericht..."
                      :line="false"
                      class="custom-textarea"
                    />
                  </div>

                  <!-- Turnstile Widget (Desktop) -->
                  <div class="turnstile-outer-wrapper">
                    <div id="turnstile-container-desktop"></div>
                  </div>

                  <div class="review-form-actions">
                    <var-button
                      type="primary"
                      :disabled="isSubmitting || newReview.star === 0 || !newReview.comment.trim() || !turnstileToken"
                      :loading="isSubmitting"
                      block
                      class="submit-review-btn"
                      @click="submitReview"
                    >
                      Bewertung senden
                    </var-button>
                  </div>

                  <Transition name="fade">
                    <p v-if="submitError" class="submit-error">{{ submitError }}</p>
                  </Transition>
                  <Transition name="fade">
                    <p v-if="submitSuccess" class="submit-success">✓ Bewertung erfolgreich gesendet!</p>
                  </Transition>
                </div>
              </Transition>
            </div>

            <!-- Reviews list (Desktop) -->
            <div class="reviews-list-container">
              <div class="reviews-list-body">
                <div v-if="isReviewsLoading" class="reviews-loading">
                  <var-loading type="circle" size="small" description="Lade Bewertungen..." />
                </div>

                <div v-else-if="reviewsError" class="reviews-error-box">
                  <p>{{ reviewsError }}</p>
                  <var-button type="primary" size="small" @click="fetchReviews(meal.id)">Erneut versuchen</var-button>
                </div>

                <div v-else-if="reviews.length === 0" class="no-reviews-box">
                  <p class="empty-copy">Noch keine Bewertungen vorhanden. Schreibe die erste!</p>
                </div>

                <div v-else class="reviews-cards-list">
                  <div v-for="rev in reviews" :key="rev.id" class="review-card">
                    <div class="review-card-header">
                      <var-rate
                        readonly
                        :model-value="rev.star"
                        size="18"
                        color="var(--color-primary)"
                        empty-color="var(--color-outline-variant)"
                      />
                      <span class="review-card-date">{{ formatDate(rev.createdAt) }}</span>
                    </div>
                    <p class="review-card-comment">{{ rev.comment }}</p>
                    <span v-if="!rev.isFromOriginalMeal" class="propagated-tag">
                      Ähnliches Gericht
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </var-popup>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted, nextTick } from 'vue'
import type { Canteen, Meal, MealFeature, MealReviewItem, MealReviewStats, PaginatedMealReviewsResponse } from '~/types/meals'
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
const runtimeConfig = useRuntimeConfig()

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

// Reviews state
const reviews = ref<MealReviewItem[]>([])
const isReviewsLoading = ref(false)
const reviewsError = ref<string | null>(null)

// Collapse states
const isReviewFormExpanded = ref(false)
const isReviewsListExpanded = ref(false)

// Star hover preview
const hoverStar = ref(0)

// Add Review form state
const newReview = ref({
  star: 0,
  comment: ''
})
const turnstileToken = ref('')
const turnstileWidgetId = ref<any>(null)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const submitSuccess = ref(false)

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

// Fetch/submit review logic
const fetchReviews = async (mealId: number) => {
  isReviewsLoading.value = true
  reviewsError.value = null
  try {
    const res = await $fetch<{ success: boolean; data: PaginatedMealReviewsResponse }>(
      `https://3b-meals.mh-home.net/meals/${mealId}/reviews?page=1&limit=50`
    )
    if (res.success && res.data) {
      reviews.value = res.data.reviews
      if (localMeal.value) {
        localMeal.value.reviewStats = res.data.stats
      }
    }
  } catch (err: any) {
    console.error('Failed to fetch reviews:', err)
    reviewsError.value = 'Fehler beim Laden der Bewertungen'
  } finally {
    isReviewsLoading.value = false
  }
}

const renderTurnstile = () => {
  const containerId = props.isMobile ? '#turnstile-container-mobile' : '#turnstile-container-desktop'
  const container = document.querySelector(containerId)
  if (typeof window !== 'undefined' && (window as any).turnstile && container) {
    // Don't re-render if we already have a widget
    if (turnstileWidgetId.value !== null) {
      try {
        (window as any).turnstile.remove(turnstileWidgetId.value)
      } catch (e) {}
      turnstileWidgetId.value = null
    }
    
    const siteKey = runtimeConfig.public.turnstileSiteKey || '0x4AAAAAADqKcwY5vdT51caz'
    
    turnstileWidgetId.value = (window as any).turnstile.render(containerId, {
      sitekey: siteKey,
      appearance: 'always',
      theme: 'auto',
      callback: (token: string) => {
        turnstileToken.value = token
        submitError.value = null
      },
      'error-callback': () => {
        turnstileToken.value = ''
      },
      'expired-callback': () => {
        turnstileToken.value = ''
      }
    })
  }
}

const submitReview = async () => {
  if (!meal.value) return
  if (newReview.value.star === 0) {
    submitError.value = 'Bitte wähle eine Sternebewertung.'
    return
  }
  if (!newReview.value.comment.trim()) {
    submitError.value = 'Bitte schreibe einen Kommentar.'
    return
  }
  if (!turnstileToken.value) {
    submitError.value = 'Bitte schließe das Captcha ab.'
    return
  }

  isSubmitting.value = true
  submitError.value = null
  submitSuccess.value = false

  try {
    const res = await $fetch<{ success: boolean; review: any }>(
      `https://3b-meals.mh-home.net/meals/${meal.value.id}/reviews`,
      {
        method: 'POST',
        body: {
          star: newReview.value.star,
          comment: newReview.value.comment.trim(),
          turnstileToken: turnstileToken.value
        }
      }
    )

    if (res.success) {
      submitSuccess.value = true
      newReview.value.star = 0
      newReview.value.comment = ''
      turnstileToken.value = ''
      
      if (typeof window !== 'undefined' && (window as any).turnstile && turnstileWidgetId.value !== null) {
        try {
          (window as any).turnstile.reset(turnstileWidgetId.value)
        } catch (e) {}
      }
      
      await fetchReviews(meal.value.id)
    }
  } catch (err: any) {
    console.error('Failed to submit review:', err)
    submitError.value = err.data?.error?.message || 'Fehler beim Absenden der Bewertung. Bitte versuche es erneut.'
  } finally {
    isSubmitting.value = false
  }
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Gerade eben'
  if (diffMins < 60) return `Vor ${diffMins} Min.`
  if (diffHours < 24) return `Vor ${diffHours} Std.`
  if (diffDays === 1) return 'Gestern'
  if (diffDays < 7) return `Vor ${diffDays} Tagen`

  return d.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

const onClosed = () => {
  localMeal.value = null
  localCanteen.value = null
  reviews.value = []
  newReview.value.star = 0
  newReview.value.comment = ''
  turnstileToken.value = ''
  submitError.value = null
  submitSuccess.value = false
  openSections.value = []
  isReviewFormExpanded.value = false
  isReviewsListExpanded.value = false
  hoverStar.value = 0

  if (typeof window !== 'undefined' && (window as any).turnstile && turnstileWidgetId.value !== null) {
    try {
      (window as any).turnstile.remove(turnstileWidgetId.value)
    } catch (e) {}
    turnstileWidgetId.value = null
  }
}

const handlePopState = (event: PopStateEvent) => {
  emit('update:show', false)
}

watch(() => props.show, async (show) => {
  if (show && props.meal) {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePopState)
      history.pushState({ dialogOpen: true }, '')
    }

    openSections.value = []
    reviews.value = []
    newReview.value.star = 0
    newReview.value.comment = ''
    turnstileToken.value = ''
    submitError.value = null
    submitSuccess.value = false
    isReviewFormExpanded.value = false
    hoverStar.value = 0
    
    await fetchReviews(props.meal.id)
  } else {
    // Remove the Turnstile widget now, while its container is still in the DOM.
    // Doing it later (in @closed/onClosed) is too late — Vue has already torn
    // down the v-if="meal && canteen" tree, so Turnstile can't find its widget
    // and logs "Cannot find Widget cf-chl-widget-…".
    if (typeof window !== 'undefined' && (window as any).turnstile && turnstileWidgetId.value !== null) {
      try {
        (window as any).turnstile.remove(turnstileWidgetId.value)
      } catch (e) {}
      turnstileWidgetId.value = null
      turnstileToken.value = ''
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', handlePopState)
      if (history.state?.dialogOpen) {
        history.back()
      }
    }
  }
})

// Auto-expand the review form body when a star is selected
watch(() => newReview.value.star, (star) => {
  if (star > 0 && !isReviewFormExpanded.value) {
    isReviewFormExpanded.value = true
  }
})

watch(isReviewFormExpanded, (expanded) => {
  if (expanded) {
    // Inject the Turnstile API script on demand so the page doesn't pay for
    // it (or for Cloudflare's preloaded challenge platform) until needed.
    if (typeof window !== 'undefined'
      && !(window as any).turnstile
      && !document.querySelector('script[data-turnstile]')) {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.turnstile = 'true'
      document.head.appendChild(script)
    }

    // Wait for v-show to make the container visible before rendering Turnstile
    // Using setTimeout to ensure the element is in the render tree and visible
    setTimeout(() => {
      if (typeof window === 'undefined') return
      if ((window as any).turnstile) {
        renderTurnstile()
        return
      }
      let attempts = 0
      const checkTurnstile = setInterval(() => {
        attempts++
        if ((window as any).turnstile) {
          clearInterval(checkTurnstile)
          renderTurnstile()
        } else if (attempts >= 50) {
          clearInterval(checkTurnstile)
          console.warn('Turnstile script failed to load')
        }
      }, 100)
    }, 50)
  } else {
    // Remove widget when form collapses to clean up
    if (typeof window !== 'undefined' && (window as any).turnstile && turnstileWidgetId.value !== null) {
      try {
        (window as any).turnstile.remove(turnstileWidgetId.value)
      } catch (e) {}
      turnstileWidgetId.value = null
      turnstileToken.value = ''
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

/* Left Column: Meal Details Card.
   The column itself is the rounded "frame" with overflow:hidden so the inner
   scroll container's scrollbar gets clipped at the rounded corners (otherwise
   the rectangular scrollbar visually extends past the curve). */
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

/* The actual scrollable layer. Has the same background so rubber-band
   overscroll on macOS doesn't reveal any transparent area between the
   content end and the dialog border. */
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

/* Match the carousel items' top corners to the dialog's 32px radius.
   The 4px difference between the item's 28px and the hero's 32px
   would show a gap at the top corners otherwise. Applied to all items
   (not just active) so the radius doesn't visibly change during the
   pill ↔ active transition. */
.hero-media :deep(.carousel-item) {
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
}

/* The first and last items sit at the hero's outer corners. A narrow
   pill can't render a full 32px radius, so it visually mismatches the
   hero's 32px curve. Setting the outer corner to 0 lets hero-media's
   overflow:hidden + 32px radius do the clipping for a perfect match. */
.hero-media :deep(.carousel-item:first-child) {
  border-top-left-radius: 0;
}
.hero-media :deep(.carousel-item:last-child) {
  border-top-right-radius: 0;
}

/* Single-image wrapper fills the hero-media — let the parent clip the corners */
.single-image-wrapper :deep(.meal-image-wrapper) {
  border-radius: 0;
}

@media (max-width: 767px) {
  .hero-media {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  /* On mobile the hero has no rounded corners, so all carousel item corners
     should just use the carousel's own 28px radius uniformly. */
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
  color: #f59e0b; /* Amber rating stars */
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

/* Reviews Scroll Gutter Padding */
.reviews-section-content {
  padding: 4px 4px 24px 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 767px) {
  .reviews-section-content {
    padding: 0 16px calc(32px + env(safe-area-inset-bottom, 0px));
    gap: 16px;
  }
}

.reviews-heading {
  margin: 0 0 12px 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-on-surface);
}

/* Standalone Add Review Card */
.add-review-container {
  background: var(--color-surface-container-low);
  border-radius: 24px;
  padding: 20px;
  border: 1px solid var(--color-outline-variant);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 767px) {
  .add-review-container {
    box-shadow: none;
    border-radius: 20px;
    background: var(--color-surface-container-high);
  }
}

/* .review-form-stars and .rate-label removed — stars now live in add-review-header */

.review-form-comment {
  width: 100%;
}

.custom-textarea {
  background: var(--color-surface-container) !important;
  border-radius: 12px !important;
  border: 1px solid var(--color-outline-variant) !important;
  padding: 8px 12px !important;
}

/* Force theme-aware text colors inside Varlet's input (which otherwise hardcodes
   colors that don't follow our CSS variables in dark mode). */
.custom-textarea :deep(textarea),
.custom-textarea :deep(.var-input__input) {
  color: var(--color-on-surface) !important;
  caret-color: var(--color-on-surface) !important;
}
.custom-textarea :deep(textarea::placeholder),
.custom-textarea :deep(.var-input__placeholder) {
  color: var(--color-on-surface-variant) !important;
  opacity: 0.7;
}
.custom-textarea :deep(.var-input__count) {
  color: var(--color-on-surface-variant) !important;
}

@media (max-width: 767px) {
  .custom-textarea {
    background: var(--color-surface-container-low) !important;
  }
}

.turnstile-outer-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  transition: min-height 0.2s ease, height 0.2s ease;
}

/* Reserve 65px height while Turnstile is loading (iframe not present yet) */
.turnstile-outer-wrapper:not(:has(iframe)) {
  min-height: 65px;
}

/* Collapse completely if Turnstile loaded and is invisible */
.turnstile-outer-wrapper:has(iframe[height="0"]),
.turnstile-outer-wrapper:has(iframe[style*="display: none"]),
.turnstile-outer-wrapper:has(iframe[style*="visibility: hidden"]) {
  min-height: 0 !important;
  height: 0 !important;
  overflow: hidden;
  margin: 0 !important;
  padding: 0 !important;
  display: none !important; /* Prevents flex gap layout shifts */
}

.submit-review-btn {
  --button-primary-color: var(--color-primary);
  --button-primary-text-color: var(--color-on-primary);
  border-radius: 99px !important;
  font-weight: 600 !important;
  height: 40px !important;
}

.submit-error {
  margin: 0;
  color: var(--color-danger);
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
}

.submit-success {
  margin: 0;
  color: #10b981;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
}

.reviews-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reviews-loading,
.reviews-error-box,
.no-reviews-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px 16px;
  background: var(--color-surface-container-low);
  border-radius: 16px;
  border: 1px dashed var(--color-outline-variant);
}

@media (max-width: 767px) {
  .reviews-loading,
  .reviews-error-box,
  .no-reviews-box {
    background: var(--color-surface-container-high);
  }
}

.reviews-loading p,
.reviews-error-box p,
.no-reviews-box p {
  margin: 0 0 12px 0;
  font-size: 0.95rem;
  color: var(--color-on-surface-variant);
}

.reviews-cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Standalone Review Card */
.review-card {
  background: var(--color-surface-container-low);
  border-radius: 20px;
  padding: 16px;
  border: 1px solid var(--color-outline-variant);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

@media (max-width: 767px) {
  .review-card {
    box-shadow: none;
    border-radius: 16px;
    background: var(--color-surface-container-high);
  }
}

.review-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Readonly rate inside review cards: no interactive hover styles and a bit larger. */
.review-card-header :deep(.var-rate__content) {
  cursor: default !important;
  padding: 0 1px !important;
  background: transparent !important;
}
.review-card-header :deep(.var-rate__content .var-hover-overlay),
.review-card-header :deep(.var-rate__content .var-ripple) {
  display: none !important;
}

.review-card-date {
  font-size: 0.8rem;
  color: var(--color-on-surface-variant);
  opacity: 0.75;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: 8px;
}

.review-card-comment {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--color-on-surface);
  word-break: break-word;
  white-space: pre-wrap;
}

.propagated-tag {
  font-size: 0.72rem;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  padding: 2px 8px;
  border-radius: 99px;
  align-self: flex-start;
  font-weight: 600;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 767px) {
  .dialog-content {
    padding: 20px 16px calc(24px + env(safe-area-inset-bottom, 0px));
  }
}

.collapsible-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.collapsible-section-header.clickable {
  cursor: pointer;
}

@media (min-width: 768px) {
  .reviews-list-container .collapsible-section-header {
    cursor: default;
  }
}

.expand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-on-surface-variant);
  transition: transform 0.2s ease;
  width: 24px;
  height: 24px;
}

.expand-icon.is-expanded {
  transform: rotate(180deg);
}

.add-review-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* margin-top is handled by container gap */
}

/* ── Add-review card header ── */
.add-review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* ── Custom star input ── */
.star-input-row {
  display: flex;
  align-items: center;
  gap: 2px;
}

.star-btn {
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: var(--color-outline-variant);
  transition: color 0.15s ease, transform 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  outline: none;
}

.star-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.star-btn.filled {
  color: var(--color-primary);
}

.star-btn.hovered {
  transform: scale(1.18);
}

/* ── review-expand transition ── */
.review-expand-enter-active,
.review-expand-leave-active {
  transition: opacity 0.28s ease, max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 600px;
  overflow: hidden;
}

.review-expand-enter-from,
.review-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.reviews-list-body {
  margin-top: 16px;
}
</style>