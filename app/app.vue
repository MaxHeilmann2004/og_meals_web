<template>
  <VitePwaManifest />
  <WebUiDisabledNotice v-if="uiDisabled" :message="message" :allow-bypass="config.webUiDisabledBypass === true" @bypass="bypassCookie = '1'" />
  <NuxtLayout v-else>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core'

const { public: config } = useRuntimeConfig()
const route = useRoute()
// Cookie is readable during SSR, so a bypassed visitor never sees the notice first.
const bypassCookie = useCookie<string | null>('og-meals-ui-bypass', {
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
  secure: !import.meta.dev,
})
const bypassed = computed(() => config.webUiDisabledBypass === true && bypassCookie.value === '1')
// The meal plan image route stays available so image rendering keeps working.
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
