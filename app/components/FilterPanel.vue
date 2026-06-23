<template>
  <div class="filter-panel">
    <h3 class="filter-section-title">Kantinen</h3>
    <div class="filter-chips-grid">
      <button
        v-for="canteen in canteens"
        :key="canteen.id"
        class="filter-chip"
        :class="{ 'is-active': filterStore.isCanteenEnabled(canteen.id) }"
        @click="filterStore.toggleCanteen(canteen.id)"
      >
        <span class="chip-label">{{ canteen.displayName || canteen.name }}</span>
        <span v-if="filterStore.isCanteenEnabled(canteen.id)" class="chip-check">✓</span>
      </button>
    </div>

    <div class="filter-divider"></div>

    <h3 class="filter-section-title">Ausblenden</h3>
    <p class="filter-section-hint">Gerichte mit diesen Merkmalen werden versteckt</p>
    <div class="filter-chips-grid">
      <button
        v-for="feature in excludeFeatures"
        :key="feature.id"
        class="filter-chip exclude-chip"
        :class="{ 'is-active': filterStore.isFeatureExcluded(feature.id) }"
        @click="filterStore.toggleFeatureExclusion(feature.id)"
      >
        <div
          v-if="feature.icon"
          class="chip-icon-mask"
          :style="{
            maskImage: `url(${feature.icon})`,
            webkitMaskImage: `url(${feature.icon})`
          }"
        ></div>
        <span class="chip-label">{{ feature.name }}</span>
        <span v-if="filterStore.isFeatureExcluded(feature.id)" class="chip-check">✕</span>
      </button>
    </div>

    <div class="filter-divider"></div>

    <h3 class="filter-section-title">Preise</h3>
    <div class="filter-switch-row" @click="filterStore.toggleStudentPrices()">
      <span class="switch-label">Studierendenpreise anzeigen</span>
      <div
        class="toggle-track"
        :class="{ 'is-on': filterStore.showStudentPrices }"
      >
        <div class="toggle-thumb"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFilterStore, EXCLUDE_FEATURES } from '~/stores/filters'

interface Canteen {
  id: number
  name: string
  displayName: string
}

defineProps<{
  canteens: Canteen[]
}>()

const filterStore = useFilterStore()
const excludeFeatures = EXCLUDE_FEATURES
</script>

<style scoped>
.filter-panel {
  padding: 20px 24px 32px;
  display: flex;
  flex-direction: column;
}

.filter-section-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-on-surface);
  margin: 0 0 6px;
  letter-spacing: 0.02em;
}

.filter-section-hint {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 0 0 10px;
  line-height: 1.3;
}

.filter-chips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 12px;
  border: 1.5px solid var(--color-outline-variant);
  background-color: transparent;
  color: var(--color-on-surface);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  font-family: inherit;
}

.filter-chip:hover {
  border-color: var(--color-outline);
  background-color: var(--color-surface-container);
}

.filter-chip:active {
  transform: scale(0.97);
}

.filter-chip.is-active {
  background-color: var(--color-primary-container);
  border-color: var(--color-primary-container);
  color: var(--color-on-primary-container);
}

.filter-chip.exclude-chip.is-active {
  background-color: var(--color-danger-container);
  border-color: var(--color-danger-container);
  color: var(--color-on-danger-container);
}

.chip-icon-mask {
  width: 16px;
  height: 16px;
  background-color: currentColor;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  flex-shrink: 0;
}

.chip-label {
  white-space: nowrap;
}

.chip-check {
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.filter-divider {
  height: 1px;
  background-color: var(--color-outline-variant);
  margin: 18px 0;
}

.filter-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  cursor: pointer;
  user-select: none;
}

.switch-label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-on-surface);
}

/* Custom toggle switch — avoids extra Varlet component overhead */
.toggle-track {
  width: 48px;
  height: 28px;
  border-radius: 14px;
  background-color: var(--color-surface-container-highest);
  position: relative;
  transition: background-color 0.25s ease;
  flex-shrink: 0;
}

.toggle-track.is-on {
  background-color: var(--color-primary);
}

.toggle-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: var(--color-surface);
  position: absolute;
  top: 3px;
  left: 3px;
  transition: transform 0.25s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.toggle-track.is-on .toggle-thumb {
  transform: translateX(20px);
  background-color: var(--color-on-primary);
}
</style>
