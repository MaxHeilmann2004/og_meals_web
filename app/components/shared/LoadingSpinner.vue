<template>
  <svg
    class="loading-spinner"
    :style="spinnerStyle"
    viewBox="0 0 100 100"
    preserveAspectRatio="xMidYMid meet"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  >
    <path
      class="loading-spinner-path"
      fill="none"
      stroke="var(--loading-spinner-color)"
      stroke-width="6"
      stroke-linecap="round"
      stroke-dasharray="138.558 118.031"
      d="M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z"
    >
      <animate
        attributeName="stroke-dashoffset"
        repeatCount="indefinite"
        dur="1.1494252873563218s"
        keyTimes="0;1"
        values="0;256.589"
      />
    </path>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  size?: number | string
  color?: string
  label?: string
}>(), {
  size: 48,
  color: 'var(--color-primary)',
  label: '',
})

const spinnerStyle = computed(() => ({
  '--loading-spinner-size': typeof props.size === 'number' ? `${props.size}px` : props.size,
  '--loading-spinner-color': props.color,
}))
</script>

<style scoped>
.loading-spinner {
  display: block;
  width: var(--loading-spinner-size);
  height: var(--loading-spinner-size);
  flex: 0 0 auto;
}

@media (prefers-reduced-motion: reduce) {
  .loading-spinner-path animate {
    display: none;
  }
}
</style>
