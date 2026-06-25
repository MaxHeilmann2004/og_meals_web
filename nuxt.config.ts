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
    '@pinia/nuxt'
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
        { name: 'description', content: 'OG Meals application rebuilt in Nuxt 4' }
      ]
    }
  }
})

