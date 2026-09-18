<template>
  <div class="admin-tools-panel">
    <p class="admin-tools-note">
      This section is reserved for admin-only actions.
    </p>
    <p v-if="adminToken" class="admin-tools-token-state">Admin token is active.</p>
    <div v-if="adminToken" class="admin-image-actions">
      <p class="admin-image-actions-title">Delete cached images:</p>
      <div
        v-for="(image, index) in meal.images"
        :key="`${image.url}-${index}`"
        class="admin-image-row"
      >
        <img
          :src="resolveMealImageUrl(image.url)"
          :alt="`Image preview ${index + 1}`"
          class="admin-image-preview"
          loading="lazy"
        />
        <span class="admin-image-url" :title="image.url">{{ image.url }}</span>
        <var-button
          type="danger"
          size="small"
          :disabled="deletingImageIndex !== null"
          @click="deleteMealImage(index, image.url)"
        >
          <LoadingSpinner
            v-if="deletingImageIndex === index"
            size="18px"
            color="currentColor"
            label="Bild wird gelöscht"
          />
          <span v-else>Delete</span>
        </var-button>
      </div>
      <p v-if="meal.images.length === 0" class="admin-image-empty">No images available for this meal.</p>
    </div>
    <p v-if="imageDeleteError" class="admin-image-error">{{ imageDeleteError }}</p>
    <p v-if="imageDeleteSuccess" class="admin-image-success">{{ imageDeleteSuccess }}</p>
    <var-button type="primary" block @click="openRawJsonInNewTab">
      Open Raw JSON in New Tab
    </var-button>
    <var-button type="info" block @click="openDetailedApiJsonInNewTab">
      Open Detailed API JSON in New Tab
    </var-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Meal, MealImageDto } from '~/types'
import { adminApi } from '~/services/adminApi'
import { mealsApi } from '~/services/mealsApi'

const props = defineProps<{
  meal: Meal
  adminToken: string
}>()

const emit = defineEmits<{
  'images-updated': [images: MealImageDto[]]
}>()

const deletingImageIndex = ref<number | null>(null)
const imageDeleteError = ref<string | null>(null)
const imageDeleteSuccess = ref<string | null>(null)

const openRawJsonInNewTab = () => {
  if (typeof window === 'undefined') return

  const rawJson = JSON.stringify(props.meal, null, 2)
  const blob = new Blob([rawJson], { type: 'application/json' })
  const objectUrl = URL.createObjectURL(blob)
  window.open(objectUrl, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10000)
}

const openDetailedApiJsonInNewTab = () => {
  if (typeof window === 'undefined') return

  window.open(mealsApi.getDetailsUrl(props.meal.id, props.adminToken), '_blank', 'noopener,noreferrer')
}

const resolveMealImageUrl = (url: string) =>
  url.startsWith('http://') || url.startsWith('https://')
    ? url
    : adminApi.imageUrl(url)

const extractImageHashFromUrl = (imageUrl: string) => {
  const stripFileExtension = (value: string) => value.replace(/\.[a-zA-Z0-9]+$/, '')

  try {
    const parsed = new URL(imageUrl, adminApi.imageUrl('/'))
    const pathParts = parsed.pathname.split('/').filter(Boolean)
    const imgSegmentIndex = pathParts.indexOf('img')
    const hashParts = imgSegmentIndex >= 0 ? pathParts.slice(imgSegmentIndex + 1) : pathParts

    if (hashParts.length === 0) return null
    if (hashParts.length === 1) return stripFileExtension(hashParts[0] ?? '') || null

    const firstHash = hashParts[0] ?? ''
    const secondHash = stripFileExtension(hashParts[1] ?? '')
    if (!firstHash || !secondHash) return null
    return secondHash.startsWith(firstHash) ? secondHash : `${firstHash}${secondHash}`
  } catch {
    return null
  }
}

const deleteMealImage = async (imageIndex: number, imageUrl: string) => {
  if (!props.adminToken || deletingImageIndex.value !== null) return

  imageDeleteError.value = null
  imageDeleteSuccess.value = null

  const imageHash = extractImageHashFromUrl(imageUrl)
  if (!imageHash) {
    imageDeleteError.value = 'Could not derive image hash from URL.'
    return
  }

  if (typeof window !== 'undefined' && !window.confirm(`Delete image ${imageHash}? This cannot be undone.`)) return

  deletingImageIndex.value = imageIndex
  try {
    const response = await adminApi.deleteImage(imageHash, props.adminToken)

    emit('images-updated', props.meal.images.filter((_, index) => index !== imageIndex))
    const linkedCount = response?.data?.linkedMealsDeleted
    imageDeleteSuccess.value = typeof linkedCount === 'number'
      ? `Image deleted (${linkedCount} linked meal references removed).`
      : 'Image deleted successfully.'
  } catch (error) {
    imageDeleteError.value = error instanceof Error ? error.message : 'Image deletion failed.'
  } finally {
    deletingImageIndex.value = null
  }
}
</script>

<style scoped>
.admin-tools-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.admin-tools-note,
.admin-tools-token-state {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-on-surface-variant);
}

.admin-image-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-image-actions-title {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-on-surface);
  font-weight: 600;
}

.admin-image-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 10px;
  background: var(--color-surface-container-low);
}

.admin-image-preview {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--color-outline-variant);
  flex-shrink: 0;
  background: var(--color-surface-container-high);
}

.admin-image-url {
  flex: 1;
  min-width: 0;
  font-size: 0.8rem;
  color: var(--color-on-surface-variant);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-image-empty,
.admin-image-error,
.admin-image-success {
  margin: 0;
  font-size: 0.85rem;
}

.admin-image-empty { color: var(--color-on-surface-variant); }
.admin-image-error { color: var(--color-error); }
.admin-image-success { color: var(--color-primary); }
</style>
