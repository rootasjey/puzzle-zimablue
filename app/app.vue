<template>
  <div class="site-shell">
    <header class="site-header page-wrap">
      <NuxtLink :to="$localePath({ name: 'index' })" class="wordmark" :aria-label="t('app.homeLabel')">
        <span>zima</span><span class="wordmark-blue">blue</span>
      </NuxtLink>
      <nav :aria-label="t('app.navigation')">
        <NuxtLink class="nav-link" :to="$localePath({ name: 'index' })">{{ t('app.home') }}</NuxtLink>
        <NuxtLink class="nav-link" :to="$localePath({ name: 'archive' })">{{ t('app.archive') }}</NuxtLink>
        <NuxtLink v-if="loggedIn && user" class="nav-link" :to="$localePath({ name: 'account' })">{{ t('app.account') }}</NuxtLink>
        <NuxtLink v-else class="nav-link account-nav" :to="$localePath({ name: 'account-sign-in' })">{{ t('app.signIn') }}</NuxtLink>
        <NuxtLink v-if="loggedIn && user?.role === 'admin'" class="nav-link admin-nav" :to="$localePath({ name: 'admin-calendar' })">{{ t('app.admin') }}</NuxtLink>
        <button class="language-switcher" type="button" :aria-label="t('app.switchLanguage', { language: nextLanguageLabel })" @click="switchLanguage">
          {{ nextLanguageCode }}
        </button>
        <div ref="themeMenu" class="theme-menu">
          <button
            ref="themeToggle"
            class="theme-toggle"
            type="button"
            :title="t('theme.label', { theme: themeLabels[theme] })"
            :aria-label="t('theme.choose')"
            aria-controls="theme-options"
            :aria-expanded="themeMenuOpen"
            @click="themeMenuOpen = !themeMenuOpen"
          >
            <span aria-hidden="true">◐</span>
            <span class="sr-only">{{ t('theme.label', { theme: themeLabels[theme] }) }}</span>
          </button>
          <Transition name="theme-pop">
            <div v-if="themeMenuOpen" id="theme-options" class="theme-options" role="group" :aria-label="t('theme.choose')">
              <button
                v-for="option in themeOptions"
                :key="option.value"
                type="button"
                :aria-pressed="theme === option.value"
                @click="setTheme(option.value)"
              >
                {{ t(option.label) }}<span v-if="theme === option.value" aria-hidden="true">✓</span>
              </button>
            </div>
          </Transition>
        </div>
      </nav>
    </header>
    <NuxtPage />
    <footer class="site-footer page-wrap">
      <span>{{ t('app.footerLine') }} <a href="https://zimablue.cc" target="_blank" rel="noreferrer">Zimablue</a>.</span>
      <span>{{ t('app.footerTagline') }}</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
type ThemePreference = 'system' | 'light' | 'dark'

const { loggedIn, user } = useUserSession()
const { $getLocale, $switchLocale, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const themeCookie = useCookie<ThemePreference>('puzzle-theme', {
  default: () => 'system',
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
})
const validThemes: ThemePreference[] = ['system', 'light', 'dark']
const theme = computed<ThemePreference>(() => validThemes.includes(themeCookie.value) ? themeCookie.value : 'system')
const themeMenu = ref<HTMLElement>()
const themeToggle = ref<HTMLButtonElement>()
const themeMenuOpen = ref(false)
const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'theme.system' },
  { value: 'light', label: 'theme.light' },
  { value: 'dark', label: 'theme.dark' },
]
const themeLabels = computed(() => Object.fromEntries(themeOptions.map(option => [option.value, t(option.label)])) as Record<ThemePreference, string>)
const currentLanguage = computed(() => $getLocale())
const nextLanguageCode = computed(() => currentLanguage.value === 'fr' ? 'EN' : 'FR')
const nextLanguageLabel = computed(() => currentLanguage.value === 'fr' ? 'English' : 'Français')

useHead({ htmlAttrs: { 'data-theme': theme } })

function setTheme(value: ThemePreference) {
  themeCookie.value = value
  themeMenuOpen.value = false
}

function closeThemeMenu(event: PointerEvent | KeyboardEvent) {
  if (event instanceof KeyboardEvent && event.key === 'Escape') {
    themeMenuOpen.value = false
    themeToggle.value?.focus()
    return
  }
  if (event instanceof PointerEvent && event.target instanceof Node && !themeMenu.value?.contains(event.target)) {
    themeMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', closeThemeMenu)
  document.addEventListener('keydown', closeThemeMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeThemeMenu)
  document.removeEventListener('keydown', closeThemeMenu)
})

function switchLanguage() {
  $switchLocale(currentLanguage.value === 'fr' ? 'en' : 'fr')
}
</script>
