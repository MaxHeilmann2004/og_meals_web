<template>
  <VitePwaManifest />
  <main v-if="uiDisabled" class="ui-disabled" role="alert">
    <h1>OG Meals</h1>
    <p>{{ message }}</p>
  </main>
  <NuxtLayout v-else>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core'

const { public: config } = useRuntimeConfig()
const route = useRoute()
// The meal plan image route stays available so image rendering keeps working.
const uiDisabled = computed(() => config.webUiDisabled === true && !route.path.startsWith('/__image'))
const message = computed(() => config.webUiDisabledMessage || 'Die Web-Oberfläche ist derzeit deaktiviert.')

// Keeps theme in sync with system preference changes at runtime.
// The initial value is set by the blocking inline script in nuxt.config.ts.
useDark({
  selector: 'html',
  attribute: 'var-theme',
  valueDark: 'dark',
  valueLight: 'light',
})
</script>



<style>
.ui-disabled {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
  color: var(--color-on-background, inherit);
}
</style>
