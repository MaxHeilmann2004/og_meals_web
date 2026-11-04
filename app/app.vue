<template>
  <VitePwaManifest />
  <WebUiDisabledNotice v-if="uiDisabled" :message="message" />
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
