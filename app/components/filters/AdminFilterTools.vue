<template>
  <template v-if="isAdmin">
    <div class="filter-divider"></div>

    <h3 class="filter-section-title">Admin Tools</h3>
    <p class="filter-section-hint">Nur sichtbar mit adminToken</p>

    <div
      class="filter-switch-row admin-theme-row"
      role="switch"
      tabindex="0"
      :aria-checked="isDark"
      aria-label="Dunkles Design für Debugging aktivieren"
      @click="toggleAdminTheme"
      @keydown.enter.prevent="toggleAdminTheme"
      @keydown.space.prevent="toggleAdminTheme"
    >
      <span class="switch-label">Dunkles Design (Debug)</span>
      <div class="toggle-track" :class="{ 'is-on': isDark }" aria-hidden="true">
        <div class="toggle-thumb"></div>
      </div>
    </div>

    <div class="admin-sync-row">
      <var-button type="warning" size="small" :disabled="isManualSyncing" @click="triggerManualSync">
        <LoadingSpinner
          v-if="isManualSyncing"
          size="18px"
          color="currentColor"
          label="Manual Sync wird ausgeführt"
        />
        <span v-else>Manual Sync</span>
      </var-button>
      <span v-if="manualSyncError" class="admin-sync-message admin-sync-error">{{ manualSyncError }}</span>
      <span v-else-if="manualSyncSuccess" class="admin-sync-message admin-sync-success">{{ manualSyncSuccess }}</span>
    </div>
  </template>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDark } from '@vueuse/core'
import { useAdminAccess } from '~/composables/useAdminAccess'
import { adminApi } from '~/services/adminApi'

const { adminToken, isAdmin } = useAdminAccess()
const isDark = useDark({
  selector: 'html',
  attribute: 'var-theme',
  valueDark: 'dark',
  valueLight: 'light',
})
const isManualSyncing = ref(false)
const manualSyncError = ref<string | null>(null)
const manualSyncSuccess = ref<string | null>(null)

const toggleAdminTheme = () => {
  if (isAdmin.value) isDark.value = !isDark.value
}

const triggerManualSync = async () => {
  if (!adminToken.value || isManualSyncing.value) return
  manualSyncError.value = null
  manualSyncSuccess.value = null
  isManualSyncing.value = true

  try {
    await adminApi.syncMeals(adminToken.value)
    manualSyncSuccess.value = 'Manual sync triggered. Reloading meals...'
    await refreshNuxtData('meals-week')
    manualSyncSuccess.value = 'Manual sync triggered successfully.'
  } catch (error: any) {
    manualSyncError.value = String(
      error?.data?.error?.message
      || error?.data?.message
      || error?.message
      || 'Manual sync failed.',
    )
  } finally {
    isManualSyncing.value = false
  }
}
</script>

<style scoped>
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

.toggle-track {
  width: 48px;
  height: 28px;
  border-radius: 14px;
  background-color: var(--color-surface-container-highest);
  position: relative;
  transition: background-color 0.25s ease;
  flex-shrink: 0;
}

.toggle-track.is-on { background-color: var(--color-primary); }

.toggle-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: var(--color-surface);
  position: absolute;
  top: 3px;
  left: 3px;
  transition: transform 0.25s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-track.is-on .toggle-thumb {
  transform: translateX(20px);
  background-color: var(--color-on-primary);
}

.admin-theme-row:focus-visible {
  outline: 3px solid var(--color-primary-container);
  outline-offset: 3px;
  border-radius: 8px;
}

.admin-sync-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.admin-sync-message { font-size: 0.8rem; font-weight: 500; }
.admin-sync-error { color: var(--color-error); }
.admin-sync-success { color: var(--color-primary); }
</style>
