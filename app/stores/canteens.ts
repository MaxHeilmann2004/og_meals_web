import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CanteenSummary } from '~/types'

export const useCanteenStore = defineStore('canteens', () => {
  const canteens = ref<CanteenSummary[]>([])

  const setCanteens = (nextCanteens: CanteenSummary[]) => {
    canteens.value = nextCanteens
  }

  return { canteens, setCanteens }
})
