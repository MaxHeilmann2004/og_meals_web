// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      turnstileSiteKey: '0x4AAAAAADqKcwY5vdT51caz' // Default sitekey, overridden by NUXT_PUBLIC_TURNSTILE_SITE_KEY env variable at runtime
    }
  },

  future: {
    compatibilityVersion: 4
  },

  modules: [
    '@varlet/nuxt',
    '@pinia/nuxt',
    '@vite-pwa/nuxt'
  ],

  css: [
    '~/assets/css/theme.css'
  ],

  app: {
    head: {
      title: 'OG Meals',
      script: [
        {
          // Runs synchronously before first paint to avoid flash of wrong theme
          innerHTML: `(function(){try{var dark=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('var-theme',dark?'dark':'light');}catch(e){}})();`
        }
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'OG Meals application rebuilt in Nuxt 4' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'OG Meals' },
        { name: 'mobile-web-app-capable', content: 'yes' }
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', href: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' }
      ]
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'OG Meals',
      short_name: 'OG Meals',
      description: 'Browse and filter OG canteen meals as a native-feeling app.',
      lang: 'en',
      theme_color: '#EE0020',
      background_color: '#201A19',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      // No precaching, no runtime caching: app requires network.
      // The service worker exists only to satisfy PWA install criteria.
      globPatterns: [],
      navigateFallback: null,
      cleanupOutdatedCaches: true,
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: []
    },
    client: {
      installPrompt: true,
      // Re-check for a new service worker every hour while the app is open.
      periodicSyncForUpdates: 3600
    },
    devOptions: {
      enabled: false
    }
  }
})

