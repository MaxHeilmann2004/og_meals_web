import { defineNuxtPlugin } from '#app'
import { createPersistedState } from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin(({ $pinia }) => {
  // Only run persistence on the client — this is the key fix.
  // On the server we skip it entirely; on the client, reads/writes localStorage.
  if (import.meta.client) {
    $pinia.use(createPersistedState({
      storage: localStorage,
    }))
  }
})
