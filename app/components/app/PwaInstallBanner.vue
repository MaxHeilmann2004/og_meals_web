<template>
  <section v-if="visible" class="pwa-banner" role="region" aria-label="App installieren">
    <img class="pwa-banner-icon" src="/pwa-64x64.png?v=2" alt="" width="40" height="40" />

    <div class="pwa-banner-text">
      <p class="pwa-banner-title">OG Meals als App nutzen</p>
      <p class="pwa-banner-description">
        Schneller Zugriff per Icon auf dem Startbildschirm und Vollbild ohne Browserleiste.
      </p>
      <p v-if="mode === 'ios'" class="pwa-banner-description">
        Tippe auf
        <svg class="pwa-banner-share" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-label="Teilen">
          <path d="M12 3v12" />
          <path d="M8 7l4-4 4 4" />
          <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
        </svg>
        und wähle „Zum Home-Bildschirm“.
      </p>
    </div>

    <div class="pwa-banner-actions">
      <button v-if="mode === 'prompt'" type="button" class="pwa-banner-install" @click="install">
        Installieren
      </button>
      <button type="button" class="pwa-banner-dismiss" aria-label="Hinweis schließen" @click="dismiss">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useNuxtApp } from '#app'
import { isBannerSnoozed, isIosSafari, isMobileDevice, isStandaloneDisplay, snoozeBanner } from '~/utils/pwa/install'

const { $pwa } = useNuxtApp()

const standalone = ref(true)
const mobile = ref(false)
const ios = ref(false)
const snoozed = ref(true)

onMounted(() => {
  standalone.value = isStandaloneDisplay()
  mobile.value = isMobileDevice(navigator.userAgent, navigator.maxTouchPoints)
  ios.value = isIosSafari(navigator.userAgent, navigator.maxTouchPoints)
  snoozed.value = isBannerSnoozed(localStorage)
})

// 'prompt': browser offers a native install prompt; 'ios': manual "Add to Home Screen" hint.
const mode = computed<'prompt' | 'ios' | null>(() => {
  if (!mobile.value || standalone.value || snoozed.value || $pwa?.isPWAInstalled) return null
  if ($pwa?.showInstallPrompt) return 'prompt'
  return ios.value ? 'ios' : null
})

const visible = computed(() => mode.value !== null)

const install = async () => {
  await $pwa?.install()
}

const dismiss = () => {
  snoozeBanner(localStorage)
  snoozed.value = true
}
</script>

<style scoped>
.pwa-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: var(--color-primary-container);
  color: var(--color-on-primary-container);
}

.pwa-banner-icon {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.pwa-banner-text {
  flex: 1;
  min-width: 0;
}

.pwa-banner-text p {
  margin: 0;
}

.pwa-banner-title {
  font-weight: 700;
  font-size: 0.9375rem;
}

.pwa-banner-description {
  font-size: 0.8125rem;
  line-height: 1.35;
}

.pwa-banner-share {
  vertical-align: -3px;
}

.pwa-banner-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.pwa-banner-install {
  border: 0;
  border-radius: 999px;
  padding: 8px 16px;
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.pwa-banner-dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.pwa-banner-dismiss:hover {
  background-color: rgba(0, 0, 0, 0.08);
}

.pwa-banner-install:focus-visible,
.pwa-banner-dismiss:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}

@media (max-width: 480px) {
  .pwa-banner {
    flex-wrap: wrap;
  }

  .pwa-banner-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
