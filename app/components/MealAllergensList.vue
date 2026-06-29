<template>
  <div v-if="allergens && allergens.length" class="chip-list">
    <div
      v-for="allergen in allergens"
      :key="allergen.id"
      class="detail-chip allergen-chip"
    >
      <span class="chip-leading allergen-leading">{{ allergen.shortName || '?' }}</span>
      <span class="chip-label">{{ prettifyAllergenName(allergen.name, allergen.shortName) }}</span>
    </div>
  </div>
  <p v-else class="empty-copy">Keine Allergene angegeben.</p>
</template>

<script setup lang="ts">
import type { MealAllergen } from '~/types/meals'

defineProps<{
  allergens: MealAllergen[] | null | undefined
}>()

const prettifyAllergenName = (name?: string | null, shortName?: string | null) => {
  if (!name) return shortName || 'Allergen'
  const normalized = name.toLowerCase().replace(/\s*\(inkl\.\s*laktose\)/i, '')
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}
</script>

<style scoped>
.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.detail-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 8px 14px 8px 8px;
  border-radius: 999px;
}

.allergen-chip {
  background: var(--color-surface-container-high);
  color: var(--color-on-surface);
}

.chip-leading {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  flex-shrink: 0;
}

.allergen-leading {
  background: var(--color-primary-container);
  color: var(--color-on-primary-container);
  font-size: 0.75rem;
  font-weight: 800;
}

.chip-label {
  font-size: 0.9rem;
  font-weight: 600;
}

.empty-copy {
  margin: 8px 0 0 0;
  color: var(--color-on-surface-variant);
}
</style>
