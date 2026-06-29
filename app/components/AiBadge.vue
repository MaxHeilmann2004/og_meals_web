<template>
  <span
    class="ai-badge"
    :class="{
      'ai-badge--absolute': absolute,
      [`ai-badge--${position}`]: absolute && position,
      'ai-badge--inline': inline
    }"
    title="AI suggested image"
  >
    <img src="/ic_ai.svg" alt="AI Icon" class="ai-icon" />
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    absolute?: boolean
    position?: 'top-right' | 'bottom-right'
    inline?: boolean
  }>(),
  {
    absolute: false,
    position: 'top-right',
    inline: false
  }
)
</script>

<style scoped>
.ai-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  z-index: 10;
}

/* Default absolute styling (for image overlays) */
.ai-badge:not(.ai-badge--inline) {
  width: 32px;
  height: 32px;
  background-color: rgba(0, 0, 0, 0.5);
}

.ai-badge--absolute {
  position: absolute;
  top: 12px;
  right: 12px;
  transition: top 0.2s ease, bottom 0.2s ease;
}

.ai-badge--bottom-right {
  top: auto;
  bottom: 12px;
}

/* Inline styling (for tags, text rows, etc.) */
.ai-badge--inline {
  width: 16px;
  height: 16px;
  background-color: var(--color-primary);
  vertical-align: middle;
}

.ai-icon {
  filter: brightness(0) invert(1); /* Ensure it renders white */
}

/* Size icon according to container */
.ai-badge:not(.ai-badge--inline) .ai-icon {
  width: 18px;
  height: 18px;
}

.ai-badge--inline .ai-icon {
  width: 10px;
  height: 10px;
}
</style>
