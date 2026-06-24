<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useDark } from '@vueuse/core'

// Keeps theme in sync with system preference changes at runtime.
// The initial value is set by the blocking inline script in nuxt.config.ts.
useDark({
  selector: 'html',
  attribute: 'var-theme',
  valueDark: 'dark',
  valueLight: 'light',
})
</script>


