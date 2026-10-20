import { readFileSync } from 'node:fs'

const { version: appVersion } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

export default defineNuxtConfig({
  compatibilityDate: '2026-10-12',
  devtools: { enabled: true },
  css: ['@dayflow/core/dist/styles.css', '~/assets/css/main.css'],
  modules: ['@unocss/nuxt', '@una-ui/nuxt', 'nuxt-auth-utils', 'nuxt-i18n-micro', '@nuxtjs/seo'],
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
  site: {
    url: 'https://puzzle.zimablue.cc',
    name: 'Puzzle Zimablue',
    description: 'Une illustration de Zimablue à reconstituer chaque jour.',
  },
  aiReady: false,
  skewProtection: false,
  linkChecker: { enabled: false },
  sitemap: {
    autoI18n: false,
    excludeAppSources: true,
    urls: [
      { loc: '/', alternatives: [{ hreflang: 'fr-FR', href: 'https://puzzle.zimablue.cc/' }, { hreflang: 'en-US', href: 'https://puzzle.zimablue.cc/en' }, { hreflang: 'x-default', href: 'https://puzzle.zimablue.cc/' }] },
      { loc: '/en', alternatives: [{ hreflang: 'fr-FR', href: 'https://puzzle.zimablue.cc/' }, { hreflang: 'en-US', href: 'https://puzzle.zimablue.cc/en' }, { hreflang: 'x-default', href: 'https://puzzle.zimablue.cc/' }] },
      { loc: '/archive', alternatives: [{ hreflang: 'fr-FR', href: 'https://puzzle.zimablue.cc/archive' }, { hreflang: 'en-US', href: 'https://puzzle.zimablue.cc/en/archive' }, { hreflang: 'x-default', href: 'https://puzzle.zimablue.cc/archive' }] },
      { loc: '/en/archive', alternatives: [{ hreflang: 'fr-FR', href: 'https://puzzle.zimablue.cc/archive' }, { hreflang: 'en-US', href: 'https://puzzle.zimablue.cc/en/archive' }, { hreflang: 'x-default', href: 'https://puzzle.zimablue.cc/archive' }] },
      { loc: '/a-propos', alternatives: [{ hreflang: 'fr-FR', href: 'https://puzzle.zimablue.cc/a-propos' }, { hreflang: 'en-US', href: 'https://puzzle.zimablue.cc/en/about' }, { hreflang: 'x-default', href: 'https://puzzle.zimablue.cc/a-propos' }] },
      { loc: '/en/about', alternatives: [{ hreflang: 'fr-FR', href: 'https://puzzle.zimablue.cc/a-propos' }, { hreflang: 'en-US', href: 'https://puzzle.zimablue.cc/en/about' }, { hreflang: 'x-default', href: 'https://puzzle.zimablue.cc/a-propos' }] },
    ],
  },
  ogImage: {
    defaults: { width: 1200, height: 630 },
  },
  routeRules: {
    '/admin': { robots: false },
    '/admin/**': { robots: false },
    '/compte': { robots: false },
    '/compte/**': { robots: false },
    '/account': { robots: false },
    '/account/**': { robots: false },
    '/en/admin': { robots: false },
    '/en/admin/**': { robots: false },
    '/en/compte': { robots: false },
    '/en/compte/**': { robots: false },
    '/en/account': { robots: false },
    '/en/account/**': { robots: false },
  },
  app: {
    pageTransition: { name: 'page-turn' },
    head: {
      title: 'Puzzle Zimablue',
      titleTemplate: '%s — Puzzle Zimablue',
      meta: [
        { name: 'theme-color', content: '#f6f8f9' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://zimablue.cc' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
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
      appVersion,
    },
  },
})
