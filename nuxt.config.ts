export default defineNuxtConfig({
  compatibilityDate: '2026-10-12',
  devtools: { enabled: true },
  css: ['@dayflow/core/dist/styles.css', '~/assets/css/main.css'],
  modules: ['@unocss/nuxt', '@una-ui/nuxt', 'nuxt-auth-utils', 'nuxt-i18n-micro'],
  nitro: { preset: 'cloudflare_module' },
  i18n: {
    locales: [
      { code: 'fr', iso: 'fr-FR', dir: 'ltr', displayName: 'Français' },
      { code: 'en', iso: 'en-US', dir: 'ltr', displayName: 'English' },
    ],
    defaultLocale: 'fr',
    strategy: 'prefix_except_default',
    translationDir: 'locales',
    disablePageLocales: true,
    autoDetectLanguage: false,
    autoDetectPath: '/',
    meta: true,
    metaBaseUrl: 'https://puzzle.zimablue.cc',
  },
  app: {
    head: {
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
  runtimeConfig: {
    adminBootstrapKey: '',
    initialAdminEmail: '',
    emailFrom: 'no-reply@zimablue.cc',
    public: {
      registrationEnabled: true,
      siteUrl: 'https://puzzle.zimablue.cc',
    },
  },
})
