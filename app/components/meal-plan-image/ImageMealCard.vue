<template>
  <div :style="cardStyle">
    <div :style="mediaStyle">
      <img
        :src="imageSrc"
        :width="media.width"
        :height="media.height"
        :style="imageStyle"
      />
      <div v-if="!model.imageUrl" :style="placeholderOverlayStyle">
        <span :style="placeholderTextStyle">Kein Bild verfügbar</span>
      </div>
      <div v-if="model.aiSuggested" :style="aiBadgeStyle">
        <img src="/ic_ai.svg" data-tint="#FFFFFF" width="18" height="18" />
      </div>
    </div>

    <div :style="infoRowStyle">
      <div :style="titleStyle">{{ model.title }}</div>
      <div :style="pricesStyle">
        <span :style="regularPriceStyle">{{ formatPrice(meal.price) }}</span>
        <span v-if="showStudentPrice" :style="studentPriceStyle">{{ formatPrice(meal.studentPrice) }}</span>
      </div>
    </div>

    <div v-if="model.hasReviews" :style="ratingRowStyle">
      <div :style="starsStyle">
        <img
          v-for="(state, index) in model.stars"
          :key="index"
          :src="starSrc(state)"
          :width="iconSize(14)"
          :height="iconSize(14)"
          :style="{ marginRight: index < 4 ? '1px' : '0px' }"
        />
      </div>
      <span :style="ratingCountStyle">{{ model.averageStars.toFixed(1) }} ({{ model.totalReviews }})</span>
    </div>

    <div :style="footerRowStyle">
      <span :style="categoryStyle">{{ model.categoryName }}</span>
      <div :style="featureIconsStyle">
        <template v-for="feature in model.features" :key="feature.id">
          <img
            v-if="getFeatureIconUrl(feature)"
            :src="getFeatureIconUrl(feature)!"
            :data-tint="getFeatureColor(feature)"
            :width="iconSize(20)"
            :height="iconSize(20)"
            :style="{ marginLeft: '6px' }"
          />
          <span v-else :style="featureBadgeStyle">{{ feature.name || feature.shortName || 'Unknown' }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Satori-compatible counterpart of meal-plan/MealCard.vue: inline styles only, no CSS variables.
import { computed } from 'vue'
import type { Canteen, Meal } from '~/types'
import type { MealPlanImageColors } from '~/config/mealPlanImageTheme'
import { apiUrl } from '~/services/apiClient'
import { getMealCardModel, type StarState } from '~/utils/meal/cardModel'
import { getFeatureColor, getFeatureIconUrl } from '~/utils/meal/features'
import { formatPrice } from '~/utils/meal/formatters'
import { MEAL_PLAN_IMAGE_CARD_PADDING, type MealPlanImageLayout } from '~/utils/meal/imageLayout'

const props = defineProps<{
  meal: Meal
  canteen: Canteen
  layout: MealPlanImageLayout
  colors: MealPlanImageColors
  showStudentPrices: boolean
  textScale?: number
}>()

const iconSize = (px: number) => Math.round(px * (props.textScale ?? 1))
const fontSize = (px: number) => `${Math.round(px * (props.textScale ?? 1) * 100) / 100}px`

const model = computed(() => getMealCardModel(props.meal, props.canteen.name))
const showStudentPrice = computed(() => props.showStudentPrices && !!props.meal.studentPrice)
const media = computed(() => ({ width: props.layout.mediaWidth, height: props.layout.mediaHeight }))
const imageSrc = computed(() => model.value.imageUrl ? apiUrl(model.value.imageUrl) : '/meal_placeholder.webp')

const STAR_PATH = 'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'
const starSrc = (state: StarState) => {
  const color = state === 'empty' ? props.colors.onSurfaceVariant : props.colors.primary
  const opacity = state === 'full' ? 1 : state === 'half' ? 0.6 : 0.3
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${STAR_PATH}" fill="${color}" fill-opacity="${opacity}"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const cardStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column',
  width: `${props.layout.cardWidth}px`,
  padding: `${MEAL_PLAN_IMAGE_CARD_PADDING}px`,
  marginBottom: '8px',
  borderRadius: '28px',
  boxSizing: 'border-box',
}))

const mediaStyle = computed(() => ({
  display: 'flex',
  position: 'relative',
  width: `${props.layout.mediaWidth}px`,
  height: `${props.layout.mediaHeight}px`,
  borderRadius: '28px',
  overflow: 'hidden',
  backgroundColor: props.colors.surfaceContainerHighest,
}))

const imageStyle = computed(() => ({
  width: `${props.layout.mediaWidth}px`,
  height: `${props.layout.mediaHeight}px`,
  objectFit: 'cover',
  borderRadius: '28px',
}))

const placeholderOverlayStyle = computed(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'absolute',
  top: '0px',
  left: '0px',
  width: `${props.layout.mediaWidth}px`,
  height: `${props.layout.mediaHeight}px`,
  backgroundColor: props.colors.placeholderOverlay,
}))

const placeholderTextStyle = computed(() => ({
  color: props.colors.onSurfaceVariant,
  fontSize: fontSize(14),
  fontWeight: 500,
}))

const aiBadgeStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'absolute',
  top: '12px',
  right: '12px',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
}

const infoRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginTop: '12px',
}

const titleStyle = computed(() => ({
  flex: 1,
  marginRight: '16px',
  fontSize: fontSize(16),
  fontWeight: 700,
  lineHeight: 1.4,
  lineClamp: 2,
  wordBreak: 'break-word',
  color: props.colors.onSurface,
}))

const pricesStyle = computed(() => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: '2px',
  fontSize: fontSize(14),
  fontWeight: 500,
  whiteSpace: 'nowrap',
}))

const regularPriceStyle = computed(() => ({
  color: props.colors.onSurface,
  ...(showStudentPrice.value
    ? { textDecoration: 'line-through', opacity: 0.7, marginRight: '8px', fontWeight: 400 }
    : {}),
}))

const studentPriceStyle = computed(() => ({
  color: props.colors.onSurface,
  fontWeight: 700,
}))

const ratingRowStyle = {
  display: 'flex',
  alignItems: 'center',
  marginTop: '6px',
}

const starsStyle = {
  display: 'flex',
  marginRight: '6px',
}

const ratingCountStyle = computed(() => ({
  fontSize: fontSize(12.8),
  fontWeight: 500,
  color: props.colors.onSurfaceVariant,
}))

const footerRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '6px',
}

// The app never defines --color-on-secondary-container, so the category name inherits the text colour.
const categoryStyle = computed(() => ({
  flex: 1,
  fontSize: fontSize(14),
  fontWeight: 500,
  color: props.colors.onSurface,
}))

const featureIconsStyle = {
  display: 'flex',
  alignItems: 'center',
}

const featureBadgeStyle = computed(() => ({
  marginLeft: '6px',
  padding: '2px 6px',
  fontSize: fontSize(12),
  fontWeight: 500,
  whiteSpace: 'nowrap',
  color: props.colors.onSurface,
}))
</script>
