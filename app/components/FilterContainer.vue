<template>
  <!--
    All three modes are Teleported to <body> so nothing inside this
    component ever participates in the page layout flow.
    Desktop: position:fixed panel (no layout shift, stays in viewport while scrolling)
    Tablet:  centered dialog with backdrop
    Mobile:  bottom sheet with backdrop
  -->
  <Teleport to="body">
    <!-- Backdrop for sheet + dialog -->
    <Transition name="backdrop-fade">
      <div
        v-if="isFilterOpen && mode !== 'side'"
        class="filter-backdrop"
        @click="filterStore.closeFilters()"
      ></div>
    </Transition>

    <!-- ── Mobile Bottom Sheet (<768px) ── -->
    <Transition name="slide-up">
      <div v-if="isFilterOpen && mode === 'sheet'" class="filter-bottom-sheet">
        <div class="sheet-handle-area" @click="filterStore.closeFilters()">
          <div class="sheet-handle"></div>
        </div>
        <div class="panel-header">
          <h2 class="panel-title">Filter</h2>
          <button class="close-btn" aria-label="Filter schließen" @click="filterStore.closeFilters()">✕</button>
        </div>
        <div class="panel-scroll">
          <FilterPanel :canteens="canteens" />
        </div>
      </div>
    </Transition>

    <!-- ── Tablet Dialog (768–1200px) ── -->
    <Transition name="dialog-pop">
      <div v-if="isFilterOpen && mode === 'dialog'" class="filter-dialog">
        <div class="panel-header">
          <h2 class="panel-title">Filter</h2>
          <button class="close-btn" aria-label="Filter schließen" @click="filterStore.closeFilters()">✕</button>
        </div>
        <div class="panel-scroll">
          <FilterPanel :canteens="canteens" />
        </div>
      </div>
    </Transition>

    <!-- ── Desktop Side Panel (≥1200px) ── -->
    <!--
      position:fixed — completely out of document flow, so the meals
      layout never shifts. Stays anchored to the viewport while scrolling.
      Internal overflow-y:auto handles tall filter content.
    -->
    <Transition name="slide-in">
      <aside v-if="isFilterOpen && mode === 'side'" class="filter-side-panel">
        <div class="panel-header">
          <h2 class="panel-title">Filter</h2>
          <button class="close-btn" aria-label="Filter schließen" @click="filterStore.closeFilters()">✕</button>
        </div>
        <div class="panel-scroll">
          <FilterPanel :canteens="canteens" />
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useFilterStore } from '~/stores/filters'

interface Canteen {
  id: number
  name: string
  displayName: string
  orderInApp: number
}

defineProps<{ canteens: Canteen[] }>()

const filterStore = useFilterStore()
const { width } = useWindowSize()
const isFilterOpen = computed(() => filterStore.isFilterOpen)

const mode = computed<'sheet' | 'dialog' | 'side'>(() => {
  if (width.value < 768) return 'sheet'
  if (width.value < 1200) return 'dialog'
  return 'side'
})
</script>

<style scoped>
/* ── Backdrop ── */
.filter-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  z-index: 200;
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active { transition: opacity 0.3s ease; }
.backdrop-fade-enter-from,
.backdrop-fade-leave-to { opacity: 0; }

/* ── Shared elements ── */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 8px;
  flex-shrink: 0;
}

.panel-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-on-surface);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-on-surface);
  font-size: 1rem;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
  font-family: inherit;
}
.close-btn:hover { background-color: var(--color-surface-container-high); }

.panel-scroll {
  overflow-y: auto;
  flex: 1;
  overscroll-behavior: contain;
}

/* ── Mobile Bottom Sheet ── */
.filter-bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 85vh;
  background-color: var(--color-surface-container);
  border-radius: 28px 28px 0 0;
  z-index: 210;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.18);
}

.sheet-handle-area {
  display: flex;
  justify-content: center;
  padding: 12px 0 0;
  cursor: pointer;
}

.sheet-handle {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background-color: var(--color-outline-variant);
}

.slide-up-enter-active { transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
.slide-up-leave-active { transition: transform 0.25s cubic-bezier(0.55, 0, 1, 0.45); }
.slide-up-enter-from,
.slide-up-leave-to { transform: translateY(100%); }

/* ── Tablet Dialog ── */
.filter-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(480px, calc(100vw - 48px));
  max-height: 80vh;
  background-color: var(--color-surface-container);
  border: 1px solid var(--color-outline-variant);
  border-radius: 28px;
  z-index: 210;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.dialog-pop-enter-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.dialog-pop-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.dialog-pop-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.92);
}
.dialog-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.95);
}

/* ── Desktop Side Panel ──
   position:fixed means:
   • Completely removed from document flow → no layout shift when opening
   • Always anchored to viewport → stays visible as the user scrolls the page
   • right/top anchored below the sticky header
*/
.filter-side-panel {
  position: fixed;
  top: 80px;   /* 64px header + 16px breathing room */
  right: 24px;
  width: 320px;
  max-height: calc(100vh - 96px);
  /* M3 Card appearance */
  background-color: var(--color-surface-container-low);
  border: 1px solid var(--color-outline-variant);
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  z-index: 50;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.slide-in-enter-active {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease;
}
.slide-in-leave-active {
  transition: transform 0.22s ease, opacity 0.2s ease;
}
.slide-in-enter-from { transform: translateX(24px); opacity: 0; }
.slide-in-leave-to   { transform: translateX(24px); opacity: 0; }
</style>
