<template>
  <div class="reviews-section-content" :class="{ 'is-mobile': isMobile }">
    <!-- Add Review form -->
    <div class="add-review-container">
      <div class="add-review-header">
        <h3 class="reviews-heading" style="margin: 0;">Gericht bewerten</h3>
        <!-- Custom star input always visible - hover preview + click to expand -->
        <div class="star-input-row">
          <button v-for="n in 5" :key="n" class="star-btn"
            :class="{ filled: n <= (hoverStar > 0 ? hoverStar : newReview.star), hovered: hoverStar > 0 && n <= hoverStar }"
            @mouseenter="hoverStar = n" @mouseleave="hoverStar = 0" @click="newReview.star = n"
            :aria-label="`${n} Stern${n > 1 ? 'e' : ''}`">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
            </svg>
          </button>
        </div>
      </div>

      <Transition name="review-expand">
        <div v-if="isReviewFormExpanded" class="add-review-body">
          <div class="review-form-comment">
            <var-input v-model="newReview.comment" textarea rows="3" :maxlength="500" show-word-limit
              placeholder="Schreibe eine Bewertung zum Gericht..." :line="false" class="custom-textarea" />
          </div>

          <!-- Turnstile Widget -->
          <div class="turnstile-outer-wrapper">
            <div :id="turnstileContainerId"></div>
          </div>

          <div class="review-form-actions">
            <var-button type="primary"
              :disabled="isSubmitting || newReview.star === 0 || !newReview.comment.trim() || !turnstileToken"
              :loading="isSubmitting" block class="submit-review-btn" @click="submitReview">
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

    <!-- Reviews list -->
    <div class="reviews-list-container">
      <div :class="{ 'reviews-list-body': !isMobile }">
        <div v-if="isReviewsLoading" class="reviews-loading">
          <var-loading type="circle" size="small" description="Lade Bewertungen..." />
        </div>

        <div v-else-if="reviewsError" class="reviews-error-box">
          <p>{{ reviewsError }}</p>
          <var-button type="primary" size="small" @click="fetchReviews(mealId)">Erneut versuchen</var-button>
        </div>

        <div v-else-if="reviews.length === 0" class="no-reviews-box">
          <p class="empty-copy">Noch keine Bewertungen vorhanden. Schreibe die erste!</p>
        </div>

        <div v-else class="reviews-cards-list">
          <div v-for="rev in reviews" :key="rev.id" class="review-card">
            <div class="review-card-header">
              <var-rate readonly :model-value="rev.star" size="18" color="var(--color-primary)"
                empty-color="var(--color-outline-variant)" />
              <span class="review-card-date">{{ formatDate(rev.createdAt) }}</span>
            </div>
            <p class="review-card-comment">{{ rev.comment }}</p>
            <span v-if="!rev.isFromOriginalMeal && rev.matchType === 'similarity'" class="propagated-tag">
              <AiBadge :inline="true" />
              Ähnliches Gericht
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { MealReviewItem, MealReviewStats, PaginatedMealReviewsResponse } from '~/types/meals'

const props = defineProps<{
  mealId: number
  show: boolean
  isMobile: boolean
}>()

const emit = defineEmits<{
  'stats-updated': [stats: MealReviewStats]
}>()

const runtimeConfig = useRuntimeConfig()

// Reviews state
const reviews = ref<MealReviewItem[]>([])
const isReviewsLoading = ref(false)
const reviewsError = ref<string | null>(null)

// Collapse states
const isReviewFormExpanded = ref(false)

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

const turnstileContainerId = computed(() => props.isMobile ? 'turnstile-container-mobile' : 'turnstile-container-desktop')

const renderTurnstile = () => {
  const containerId = `#${turnstileContainerId.value}`
  const container = document.querySelector(containerId)
  if (typeof window !== 'undefined' && (window as any).turnstile && container) {
    // Don't re-render if we already have a widget
    if (turnstileWidgetId.value !== null) {
      try {
        (window as any).turnstile.remove(turnstileWidgetId.value)
      } catch (e) { }
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

const fetchReviews = async (id: number) => {
  isReviewsLoading.value = true
  reviewsError.value = null
  try {
    const res = await $fetch<{ success: boolean; data: PaginatedMealReviewsResponse }>(
      `https://3b-meals.mh-home.net/meals/${id}/reviews?page=1&limit=50`
    )
    if (res.success && res.data) {
      reviews.value = res.data.reviews
      emit('stats-updated', res.data.stats)
    }
  } catch (err: any) {
    console.error('Failed to fetch reviews:', err)
    reviewsError.value = 'Fehler beim Laden der Bewertungen'
  } finally {
    isReviewsLoading.value = false
  }
}

const submitReview = async () => {
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
      `https://3b-meals.mh-home.net/meals/${props.mealId}/reviews`,
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
        } catch (e) { }
      }

      await fetchReviews(props.mealId)
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

const resetForm = () => {
  newReview.value.star = 0
  newReview.value.comment = ''
  turnstileToken.value = ''
  submitError.value = null
  submitSuccess.value = false
  isReviewFormExpanded.value = false
  hoverStar.value = 0
}

watch(() => props.mealId, (newMealId) => {
  resetForm()
  if (newMealId && props.show) {
    fetchReviews(newMealId)
  }
})

watch(() => props.show, (show) => {
  if (show) {
    resetForm()
    if (props.mealId) {
      fetchReviews(props.mealId)
    }
  } else {
    // Clean up Turnstile
    if (typeof window !== 'undefined' && (window as any).turnstile && turnstileWidgetId.value !== null) {
      try {
        (window as any).turnstile.remove(turnstileWidgetId.value)
      } catch (e) { }
      turnstileWidgetId.value = null
      turnstileToken.value = ''
    }
  }
}, { immediate: true })

// Auto-expand the review form body when a star is selected
watch(() => newReview.value.star, (star) => {
  if (star > 0 && !isReviewFormExpanded.value) {
    isReviewFormExpanded.value = true
  }
})

watch(isReviewFormExpanded, (expanded) => {
  if (expanded) {
    // Inject Turnstile script
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
    // Clean up Turnstile
    if (typeof window !== 'undefined' && (window as any).turnstile && turnstileWidgetId.value !== null) {
      try {
        (window as any).turnstile.remove(turnstileWidgetId.value)
      } catch (e) { }
      turnstileWidgetId.value = null
      turnstileToken.value = ''
    }
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined' && (window as any).turnstile && turnstileWidgetId.value !== null) {
    try {
      (window as any).turnstile.remove(turnstileWidgetId.value)
    } catch (e) { }
    turnstileWidgetId.value = null
  }
})
</script>

<style scoped>
.reviews-section-content {
  padding: 4px 4px 24px 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reviews-section-content.is-mobile {
  padding: 0 16px calc(32px + env(safe-area-inset-bottom, 0px));
}

.reviews-heading {
  margin: 0 0 12px 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-on-surface);
}

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

.is-mobile .add-review-container {
  box-shadow: none;
  border-radius: 20px;
  background: var(--color-surface-container-high);
}

.review-form-comment {
  width: 100%;
}

.custom-textarea {
  background: var(--color-surface-container) !important;
  border-radius: 12px !important;
  border: 1px solid var(--color-outline-variant) !important;
  padding: 8px 12px !important;
}

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

.is-mobile .custom-textarea {
  background: var(--color-surface-container-low) !important;
}

.turnstile-outer-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  transition: min-height 0.2s ease, height 0.2s ease;
}

.turnstile-outer-wrapper:not(:has(iframe)) {
  min-height: 65px;
}

.turnstile-outer-wrapper:has(iframe[height="0"]),
.turnstile-outer-wrapper:has(iframe[style*="display: none"]),
.turnstile-outer-wrapper:has(iframe[style*="visibility: hidden"]) {
  min-height: 0 !important;
  height: 0 !important;
  overflow: hidden;
  margin: 0 !important;
  padding: 0 !important;
  display: none !important;
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

.reviews-list-body {
  margin-top: 16px;
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

.is-mobile .reviews-loading,
.is-mobile .reviews-error-box,
.is-mobile .no-reviews-box {
  background: var(--color-surface-container-high);
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

.is-mobile .review-card {
  box-shadow: none;
  border-radius: 16px;
  background: var(--color-surface-container-high);
}

.review-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  padding: 2px 8px;
  border-radius: 99px;
  align-self: flex-start;
  font-weight: 600;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.add-review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

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

.empty-copy {
  margin: 8px 0 0 0;
  color: var(--color-on-surface-variant);
}
</style>
