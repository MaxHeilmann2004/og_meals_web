<template>
  <div class="add-review-container" :class="{ 'is-mobile': isMobile }">
    <div class="add-review-header">
      <h3 class="reviews-heading" style="margin: 0;">Gericht bewerten</h3>
      <div class="star-input-row">
        <button
          v-for="n in 5"
          :key="n"
          class="star-btn"
          :class="{ filled: n <= (hoverStar > 0 ? hoverStar : newReview.star), hovered: hoverStar > 0 && n <= hoverStar }"
          :aria-label="`${n} Stern${n > 1 ? 'e' : ''}`"
          @mouseenter="hoverStar = n"
          @mouseleave="hoverStar = 0"
          @click="newReview.star = n"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
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

        <div class="turnstile-outer-wrapper">
          <div class="turnstile-widget-slot">
            <div class="turnstile-shimmer-placeholder" aria-hidden="true"></div>
            <div :id="turnstileContainerId" class="turnstile-container"></div>
          </div>
        </div>

        <div class="review-form-actions">
          <var-button
            type="primary"
            :disabled="isSubmitting || newReview.star === 0 || !newReview.comment.trim() || !turnstileToken"
            block
            class="submit-review-btn"
            @click="submitReview"
          >
            <LoadingSpinner
              v-if="isSubmitting"
              size="18px"
              color="currentColor"
              label="Bewertung wird gesendet"
            />
            <span v-else>Bewertung senden</span>
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
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { reviewsApi } from '~/services/reviewsApi'

const props = defineProps<{
  mealId: number
  show: boolean
  isMobile: boolean
}>()

const emit = defineEmits<{
  submitted: []
}>()

const runtimeConfig = useRuntimeConfig()
const isReviewFormExpanded = ref(false)
const hoverStar = ref(0)
const newReview = ref({ star: 0, comment: '' })
const turnstileToken = ref('')
const turnstileWidgetId = ref<any>(null)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const submitSuccess = ref(false)

const turnstileContainerId = computed(() => props.isMobile ? 'turnstile-container-mobile' : 'turnstile-container-desktop')

const removeTurnstile = () => {
  if (typeof window === 'undefined' || !(window as any).turnstile || turnstileWidgetId.value === null) return
  try {
    ;(window as any).turnstile.remove(turnstileWidgetId.value)
  } catch { /* Turnstile may already have removed the widget. */ }
  turnstileWidgetId.value = null
  turnstileToken.value = ''
}

const renderTurnstile = () => {
  const containerId = `#${turnstileContainerId.value}`
  const container = document.querySelector(containerId)
  if (typeof window === 'undefined' || !(window as any).turnstile || !container) return

  removeTurnstile()
  const siteKey = runtimeConfig.public.turnstileSiteKey || '0x4AAAAAADqKcwY5vdT51caz'
  turnstileWidgetId.value = (window as any).turnstile.render(containerId, {
    sitekey: siteKey,
    appearance: 'always',
    theme: 'auto',
    callback: (token: string) => {
      turnstileToken.value = token
      submitError.value = null
    },
    'error-callback': () => { turnstileToken.value = '' },
    'expired-callback': () => { turnstileToken.value = '' },
  })
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
    const response = await reviewsApi.submit(props.mealId, {
      star: newReview.value.star,
      comment: newReview.value.comment.trim(),
      turnstileToken: turnstileToken.value,
    })

    if (!response.success) return

    submitSuccess.value = true
    useTrackEvent('Review Submitted', {
      props: {
        meal_id: String(props.mealId),
        rating: String(newReview.value.star),
      },
    })
    newReview.value.star = 0
    newReview.value.comment = ''
    turnstileToken.value = ''
    if (typeof window !== 'undefined' && (window as any).turnstile && turnstileWidgetId.value !== null) {
      try { (window as any).turnstile.reset(turnstileWidgetId.value) } catch { /* ignore reset failures */ }
    }
    emit('submitted')
  } catch (error: any) {
    console.error('Failed to submit review:', error)
    submitError.value = error.data?.error?.message || 'Fehler beim Absenden der Bewertung. Bitte versuche es erneut.'
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  newReview.value = { star: 0, comment: '' }
  turnstileToken.value = ''
  submitError.value = null
  submitSuccess.value = false
  isReviewFormExpanded.value = false
  hoverStar.value = 0
}

watch(() => props.mealId, resetForm)
watch(() => props.show, (show) => {
  if (show) resetForm()
  else removeTurnstile()
}, { immediate: true })

watch(() => newReview.value.star, (star) => {
  if (star > 0 && !isReviewFormExpanded.value) isReviewFormExpanded.value = true
})

watch(isReviewFormExpanded, (expanded) => {
  if (!expanded) {
    removeTurnstile()
    return
  }

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
})

onUnmounted(removeTurnstile)
</script>

<style scoped>
.reviews-heading {
  margin: 0 0 12px 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-on-surface);
}

.add-review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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

.add-review-container.is-mobile {
  box-shadow: none;
  border-radius: 20px;
  background: var(--color-surface-container-high);
}

.review-form-comment { width: 100%; }

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

.add-review-container.is-mobile .custom-textarea {
  background: var(--color-surface-container-low) !important;
}

.turnstile-outer-wrapper {
  min-height: 69px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin: 12px 0;
}

.turnstile-widget-slot {
  position: relative;
  width: min(300px, 100%);
  min-height: 69px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.turnstile-container {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 69px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.turnstile-shimmer-placeholder {
  position: absolute;
  inset: 0 0 auto;
  width: 100%;
  height: 65px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--color-surface-container-highest) 25%, var(--color-outline-variant) 37%, var(--color-surface-container-highest) 63%);
  background-size: 200% 100%;
  animation: turnstile-shimmer 1.5s infinite linear;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.turnstile-widget-slot:has(iframe:not([height="0"]):not([style*="display: none"]):not([style*="visibility: hidden"])) .turnstile-shimmer-placeholder {
  opacity: 0;
  animation: none;
}

@keyframes turnstile-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.submit-review-btn {
  --button-primary-color: var(--color-primary);
  --button-primary-text-color: var(--color-on-primary);
  border-radius: 99px !important;
  font-weight: 600 !important;
  height: 40px !important;
}

.submit-error,
.submit-success {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
}

.submit-error { color: var(--color-danger); }
.submit-success { color: #10b981; }

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

.star-btn.filled { color: var(--color-primary); }
.star-btn.hovered { transform: scale(1.18); }

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

.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
