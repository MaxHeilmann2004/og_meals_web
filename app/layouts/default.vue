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
          <ClientOnly>
            <span v-if="filterStore.activeFilterCount > 0" class="filter-badge">
              {{ filterStore.activeFilterCount }}
            </span>
          </ClientOnly>
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="app-content">
      <slot />
    </main>

    <footer class="app-footer">
      <button type="button" class="imprint-link" @click="isImprintOpen = true">
        Impressum
      </button>
    </footer>

    <!-- Dialogs teleport to <body> — no layout impact -->
    <FilterContainer :canteens="canteens" />
    <ClientOnly>
      <ImprintDialog v-model:show="isImprintOpen" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useFilterStore } from '~/stores/filters'
import { useCanteenStore } from '~/stores/canteens'

const filterStore = useFilterStore()
const isImprintOpen = ref(false)

const canteenStore = useCanteenStore()
const canteens = computed(() => canteenStore.canteens)

onMounted(async () => {
  // Initialize Varlet Touch Emulator for desktop browser mouse events
  try {
    await import('@varlet/touch-emulator')
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

.app-footer {
  display: flex;
  justify-content: center;
  padding: 12px 16px calc(20px + env(safe-area-inset-bottom, 0px));
  background-color: var(--color-body);
}

.imprint-link {
  padding: 8px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 0.875rem;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.imprint-link:hover {
  background-color: var(--color-surface-container-high);
  color: var(--color-on-surface);
}

.imprint-link:focus-visible {
  outline: 3px solid var(--color-primary-container);
  outline-offset: 2px;
}
</style>
