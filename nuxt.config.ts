// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxt/ui', '@pinia/nuxt'],
  icon: {
    clientBundle: {
      scan: true,
    },
  },
  nitro: {
    errorHandler: '~~/server/utils/error-handler',
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Client Project Tracker',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Track client projects, progress, and priorities for your agency.' },
      ],
    },
  },
})
