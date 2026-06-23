<template>
  <div class="layout-container">
    <!-- Top App Bar -->
    <header class="app-header">
      <div class="header-left">
        <!-- Spacer to balance the right-aligned filter button -->
      </div>
      <div class="header-center">
        <img src="/logo.svg" alt="OG Meals Logo" class="app-logo" />
      </div>
      <div class="header-right">
        <button class="icon-button" aria-label="Filter" @click="filterStore.toggleFilters()">
          <div class="filter-icon-mask"></div>
          <span v-if="filterStore.activeFilterCount > 0" class="filter-badge">
            {{ filterStore.activeFilterCount }}
          </span>
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="app-content">
      <slot />
    </main>
    <!-- FilterContainer teleports all modes to <body> — no layout impact -->
    <FilterContainer :canteens="canteens" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import { useFilterStore } from '~/stores/filters'

const filterStore = useFilterStore()

interface Canteen {
  id: number
  name: string
  displayName: string
}

const canteens = ref<Canteen[]>([])

// Provide a setter so the page can push canteen data up to the layout
const setCanteens = (c: Canteen[]) => {
  canteens.value = c
}
provide('setLayoutCanteens', setCanteens)

onMounted(async () => {
  // Initialize Varlet Touch Emulator for desktop browser mouse events
  try {
    // @ts-expect-error - no types available for @varlet/touch-emulator
    const { default: touchEmulator } = await import('@varlet/touch-emulator')
    touchEmulator()
  } catch (e) {
    console.warn('Touch emulator failed to initialize:', e)
  }
})
</script>

<style scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-body);
}

.app-header {
  height: 64px;
  background-color: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left, .header-right {
  width: 48px;
  display: flex;
  align-items: center;
}

.header-right {
  justify-content: flex-end;
}

.header-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-logo {
  height: 32px;
  width: auto;
  display: block;
}

.icon-button {
  background: none;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-on-surface);
  transition: background-color 0.2s ease;
  position: relative;
}

.icon-button:hover {
  background-color: var(--color-surface-container-high);
}

.icon-button:active {
  background-color: var(--color-surface-container-highest);
}

.filter-icon-mask {
  width: 24px;
  height: 24px;
  background-color: var(--color-on-surface);
  mask-image: url('/icons/ic_instant_mix.svg');
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-image: url('/icons/ic_instant_mix.svg');
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
}

.filter-badge {
  position: absolute;
  top: 2px;
  right: 0;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 0.6875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  box-sizing: border-box;
  pointer-events: none;
  line-height: 1;
}

.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
