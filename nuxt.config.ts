export default defineNuxtConfig({
  compatibilityDate: '2026-10-12',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: ['@unocss/nuxt', '@una-ui/nuxt'],
  nitro: { preset: 'cloudflare_module' },
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Puzzle Zimablue',
      titleTemplate: '%s — Puzzle Zimablue',
      meta: [
        { name: 'description', content: 'Une illustration de Zimablue à reconstituer chaque jour.' },
        { name: 'theme-color', content: '#f6f8f9' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://zimablue.cc' },
        { rel: 'icon', href: 'https://zimablue.cc/favicon.ico' },
      ],
    },
  },
})
