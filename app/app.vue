<template>
  <VitePwaManifest />
  <WebUiDisabledNotice v-if="uiDisabled" :message="message" :allow-bypass="config.webUiDisabledBypass === true" @bypass="bypassed = true" />
  <NuxtLayout v-else>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core'

const { public: config } = useRuntimeConfig()
const route = useRoute()
// The meal plan image route stays available so image rendering keeps working.
const BYPASS_KEY = 'og-meals-ui-bypass'
const bypassed = ref(false)
// Read after mount so server and client render the same markup.
onMounted(() => {
  bypassed.value = config.webUiDisabledBypass === true && localStorage.getItem(BYPASS_KEY) === '1'
})
watch(bypassed, (value) => {
  if (value) localStorage.setItem(BYPASS_KEY, '1')
})
const uiDisabled = computed(() => config.webUiDisabled === true && !bypassed.value && !route.path.startsWith('/__image'))
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
