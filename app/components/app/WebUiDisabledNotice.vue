<template>
  <main class="disabled-notice" role="alert">
    <div class="disabled-notice__blobs" aria-hidden="true">
      <span v-for="blob in blobs" :key="blob.id" class="disabled-notice__blob" :style="blob.style" />
    </div>
    <div class="disabled-notice__rain" aria-hidden="true">
      <span
        v-for="drop in drops"
        :key="drop.id"
        class="disabled-notice__drop"
        :style="{ left: drop.left, fontSize: drop.size, animationDuration: drop.duration, animationDelay: drop.delay }"
      >😭</span>
    </div>
    <section class="disabled-notice__card">
      <div class="disabled-notice__icon-wrap">
        <img class="disabled-notice__logo" src="/icon.svg" alt="OG Meals" width="96" height="96">
        <span class="disabled-notice__badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 0 1 6.32 12.9L7.1 5.68A7.96 7.96 0 0 1 12 4ZM5.68 7.1l11.22 11.22A8 8 0 0 1 5.68 7.1Z" />
          </svg>
        </span>
      </div>
      <h1 class="disabled-notice__title">OG Meals ist offline</h1>
      <p class="disabled-notice__message">
        <template v-for="(part, i) in parts" :key="i">
          <a v-if="part.href" :href="part.href" target="_blank" rel="noopener noreferrer">{{ part.text }}</a>
          <template v-else>{{ part.text }}</template>
        </template>
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
const props = defineProps<{ message: string }>()

// Each blob is a soft circle orbiting its own anchor point; anchors are spread across the viewport.
const anchors = [[10, 14], [90, 20], [50, 6], [12, 72], [88, 78], [50, 94]]
const blobs = anchors.map(([x, y], i) => ({
  id: i,
  style: {
    '--cx': `${x}%`,
    '--cy': `${y}%`,
    '--size': `${24 + (i % 3) * 8}vmax`,
    '--radius': `${12 + (i % 3) * 6}vmin`,
    '--duration': `${4 + i * 0.8}s`,
    '--delay': `-${i * 2}s`,
    '--direction': i % 2 ? 'reverse' : 'normal',
  },
}))

// Deterministic values keep server and client markup identical (no hydration mismatch).
const drops = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 6) % 96}%`,
  size: `${18 + ((i * 7) % 4) * 6}px`,
  duration: `${14 + ((i * 5) % 7)}s`,
  delay: `-${(i * 3) % 17}s`,
}))

// Splits the message so plain http(s) URLs become links without rendering raw HTML.
const parts = computed(() =>
  props.message
    .split(/(https?:\/\/[^\s]+?)(?=[.,;:!?)]*(?:\s|$))/g)
    .filter(Boolean)
    .map(text => (/^https?:\/\//.test(text) ? { text, href: text } : { text, href: '' })),
)
</script>

<style scoped>
.disabled-notice {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  background: var(--color-body);
  color: var(--color-on-surface);
}

.disabled-notice__blobs {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.disabled-notice__blob {
  position: absolute;
  top: var(--cy);
  left: var(--cx);
  width: var(--size);
  height: var(--size);
  margin: calc(var(--size) / -2) 0 0 calc(var(--size) / -2);
  border-radius: 50%;
  opacity: 0.4;
  background: radial-gradient(circle, var(--color-primary-container) 0, transparent 65%);
  animation: disabled-notice-orbit var(--duration) linear var(--delay) infinite var(--direction);
}

/* The dark theme's container color is much stronger, so dim it further. */
:root[var-theme='dark'] .disabled-notice__blob {
  opacity: 0.2;
}

@keyframes disabled-notice-orbit {
  from { transform: rotate(0deg) translateX(var(--radius)) rotate(0deg); }
  to { transform: rotate(360deg) translateX(var(--radius)) rotate(-360deg); }
}

.disabled-notice__rain {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.disabled-notice__drop {
  position: absolute;
  top: -48px;
  line-height: 1;
  opacity: 0.15;
  animation: disabled-notice-fall linear infinite;
}

@keyframes disabled-notice-fall {
  to { transform: translateY(calc(100vh + 96px)) rotate(12deg); }
}

@media (prefers-reduced-motion: reduce) {
  .disabled-notice__rain { display: none; }
  .disabled-notice__blob { animation: none; }
}

.disabled-notice__card {
  position: relative;
  max-width: 480px;
  width: 100%;
  padding: 40px 28px 36px;
  border-radius: 28px;
  text-align: center;
  background: var(--color-surface-container-low);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.disabled-notice__icon-wrap {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.disabled-notice__logo {
  display: block;
  border-radius: 24px;
  filter: grayscale(0.35);
}

.disabled-notice__badge {
  position: absolute;
  right: -10px;
  bottom: -10px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-danger);
  color: var(--color-on-danger);
  border: 3px solid var(--color-surface-container-low);
}

.disabled-notice__title {
  margin: 0 0 12px;
  font-size: 1.6rem;
  font-weight: 700;
}

.disabled-notice__message {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-on-surface-variant);
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.disabled-notice__message a {
  color: var(--color-primary);
  font-weight: 600;
}
</style>
