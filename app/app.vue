<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDark } from '@vueuse/core'

onMounted(() => {
  useDark({
    selector: 'html',
    attribute: 'var-theme',
    valueDark: 'dark',
    valueLight: 'light',
  })
})
</script>


