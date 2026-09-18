<template>
  <var-popup
    :show="show"
    :position="isMobile ? 'bottom' : 'center'"
    :fullscreen="isMobile"
    :safe-area="false"
    :safe-area-top="false"
    :close-on-click-overlay="true"
    @update:show="emit('update:show', $event)"
  >
    <section
      class="imprint-dialog"
      :class="{ 'imprint-dialog--mobile': isMobile }"
      role="dialog"
      aria-modal="true"
      aria-labelledby="imprint-heading"
    >
      <button
        ref="closeButton"
        type="button"
        class="imprint-dialog-close"
        aria-label="Impressum schließen"
        @click="emit('update:show', false)"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div class="imprint-dialog-scroll">
        <header class="imprint-dialog-header">
          <p class="imprint-eyebrow">Anbieterkennzeichnung</p>
          <h2 id="imprint-heading">Impressum</h2>
        </header>

        <div class="imprint-content">
          <section aria-labelledby="provider-heading">
            <h3 id="provider-heading">Angaben gemäß § 5 DDG</h3>
            <address>
              Max Heilmann<br />
              Dieselstraße 26<br />
              22307 Hamburg
            </address>
          </section>

          <section aria-labelledby="contact-heading">
            <h3 id="contact-heading">Kontakt</h3>
            <p>
              E-Mail:
              <a href="mailto:heilmann@matix-media.net">heilmann@matix-media.net</a>
            </p>
          </section>

          <section class="imprint-notice" aria-labelledby="notice-heading">
            <h3 id="notice-heading">Hinweis zum Projekt</h3>
            <p>
              OG Meals ist ein privates, inoffizielles Projekt, das von einem Mitarbeiter für andere
              Mitarbeitende entwickelt wurde. Es ist kein offizielles Angebot der Otto Group und wird
              von ihr weder betrieben noch beauftragt.
            </p>
            <p>
              Die dargestellten Informationen basieren teilweise auf Daten aus offiziellen Angeboten
              der Otto Group und werden durch dieses Projekt eigenständig neu aufbereitet.
            </p>
          </section>
        </div>
      </div>
    </section>
  </var-popup>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [show: boolean]
}>()

const isMobile = useMediaQuery('(max-width: 767px)')
const closeButton = ref<HTMLButtonElement | null>(null)

watch(() => props.show, async (show) => {
  if (!show) return
  await nextTick()
  closeButton.value?.focus()
})
</script>

<style scoped>
:deep(.var-popup__content) {
  background: transparent !important;
  box-shadow: none !important;
}

.imprint-dialog {
  position: relative;
  width: min(620px, calc(100vw - 32px));
  max-height: min(720px, calc(100dvh - 32px));
  overflow: hidden;
  border-radius: 32px;
  background: var(--color-surface-container-low);
  color: var(--color-on-surface);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
}

.imprint-dialog--mobile {
  width: 100%;
  height: 100%;
  max-height: 100%;
  border-radius: 0;
}

.imprint-dialog-scroll {
  max-height: inherit;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 32px 28px calc(32px + env(safe-area-inset-bottom, 0px));
}

.imprint-dialog--mobile .imprint-dialog-scroll {
  height: 100%;
  padding: 24px 18px calc(24px + env(safe-area-inset-bottom, 0px));
}

.imprint-dialog-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--color-surface-container-highest);
  color: var(--color-on-surface);
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.imprint-dialog-close:hover {
  background: var(--color-surface-container-high);
  transform: scale(1.05);
}

.imprint-dialog-close:focus-visible,
.imprint-content a:focus-visible {
  outline: 3px solid var(--color-primary-container);
  outline-offset: 2px;
}

.imprint-dialog-header {
  padding-right: 52px;
}

.imprint-eyebrow {
  margin: 0 0 6px;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.imprint-dialog-header h2 {
  margin: 0;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  line-height: 1.15;
}

.imprint-content {
  display: grid;
  gap: 24px;
  margin-top: 28px;
}

.imprint-content section {
  display: grid;
  gap: 8px;
}

.imprint-content h3 {
  margin: 0;
  font-size: 1rem;
  line-height: 1.3;
}

.imprint-content p,
.imprint-content address {
  margin: 0;
  color: var(--color-on-surface-variant);
  font-size: 0.975rem;
  font-style: normal;
  line-height: 1.6;
}

.imprint-content a {
  color: var(--color-primary);
  overflow-wrap: anywhere;
  text-underline-offset: 3px;
}

.imprint-notice {
  padding: 18px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 18px;
  background: var(--color-surface-container);
}
</style>
