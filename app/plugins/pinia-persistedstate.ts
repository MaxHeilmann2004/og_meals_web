import { defineNuxtPlugin } from '#app'
import { createPersistedState } from 'pinia-plugin-persistedstate'

/**
 * Pinia persistedstate plugin using Nuxt's useCookie as storage.
 * Running on both server and client means SSR has access to the same
 * filter state the user saved, so filteredCanteens is identical
 * between server-render and client-hydration → no hydration mismatch.
 */
export default defineNuxtPlugin(({ $pinia }) => {
  $pinia.use(createPersistedState({
    storage: {
      getItem: (key: string): string | null => {
        // useCookie is isomorphic: reads from request headers on server,
        // from document.cookie on client.
        const cookie = useCookie<string | null>(key, {
          default: () => null,
          maxAge: 60 * 60 * 24 * 365, // 1 year
          sameSite: 'lax',
          path: '/',
        })
        return cookie.value ?? null
      },
      setItem: (key: string, value: string): void => {
        const cookie = useCookie<string>(key, {
          maxAge: 60 * 60 * 24 * 365,
          sameSite: 'lax',
          path: '/',
        })
        cookie.value = value
      },
      removeItem: (key: string): void => {
        const cookie = useCookie<string | null>(key, { path: '/' })
        cookie.value = null
      },
    },
  }))
})
