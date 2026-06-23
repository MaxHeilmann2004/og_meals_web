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
        <button class="icon-button" aria-label="Filter" @click="onFilterClick">
          <div class="filter-icon-mask"></div>
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="app-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(async () => {
  // Initialize Varlet Touch Emulator for desktop browser mouse events
  try {
    const { default: touchEmulator } = await import('@varlet/touch-emulator')
    touchEmulator()
  } catch (e) {
    console.warn('Touch emulator failed to initialize:', e)
  }
})

const onFilterClick = () => {
  // Placeholder click handler
}
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

.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
}
</style>
