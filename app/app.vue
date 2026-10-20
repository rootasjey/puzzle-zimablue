<template>
  <div class="site-shell" :class="{ 'has-mobile-bottom-nav': !isGameplayRoute, 'nav-bars-hidden': navBarsHidden }">
    <header class="site-header page-wrap" :inert="navBarsHidden" @focusin="showNavigationBars">
      <NuxtLink :to="$localePath({ name: 'index' })" class="wordmark" :aria-label="t('app.homeLabel')">
        <BrandLogo />
      </NuxtLink>
      <nav class="primary-nav" :class="{ 'is-gameplay-route': isGameplayRoute }" :aria-label="t('app.navigation')">
        <NuxtLink
          class="nav-link mobile-nav-link"
          :class="{ 'is-current-section': isNavigationSectionActive('home') }"
          :to="$localePath({ name: 'index' })"
          :aria-label="t('app.home')"
          :aria-current="isNavigationSectionActive('home') ? 'page' : undefined"
        >
          <span class="mobile-nav-icon i-lucide-house" aria-hidden="true" />
          <span class="desktop-nav-label">{{ t('app.home') }}</span>
          <span class="mobile-nav-label">{{ t('app.mobileHome') }}</span>
        </NuxtLink>
        <NuxtLink
          class="nav-link mobile-nav-link master-nav-link"
          :class="{ 'is-current-section': isNavigationSectionActive('master') }"
          :to="$localePath({ name: 'master' })"
          :aria-current="isNavigationSectionActive('master') ? 'page' : undefined"
        >
          <span class="mobile-nav-icon i-lucide-puzzle" aria-hidden="true" />
          <span class="desktop-nav-label">{{ t('app.master') }}</span>
          <span class="mobile-nav-label">{{ t('app.master') }}</span>
        </NuxtLink>
        <NuxtLink
          class="nav-link mobile-nav-link"
          :class="{ 'is-current-section': isNavigationSectionActive('archive') }"
          :to="$localePath({ name: 'archive' })"
          :aria-label="t('app.archive')"
          :aria-current="isNavigationSectionActive('archive') ? 'page' : undefined"
        >
          <span class="mobile-nav-icon i-lucide-archive" aria-hidden="true" />
          <span class="desktop-nav-label">{{ t('app.archive') }}</span>
          <span class="mobile-nav-label">{{ t('app.archive') }}</span>
        </NuxtLink>
        <NuxtLink
          v-if="loggedIn && user"
          class="nav-link mobile-nav-link account-nav"
          :class="{ 'is-current-section': isNavigationSectionActive('account') }"
          :to="$localePath({ name: 'account' })"
          :aria-label="t('app.account')"
          :aria-current="isNavigationSectionActive('account') ? 'page' : undefined"
        >
          <span class="mobile-nav-icon i-lucide-user-round" aria-hidden="true" />
          <span class="desktop-nav-label">
            <img v-if="preferences.avatarUrl()" class="account-nav-avatar" :src="preferences.avatarUrl()" alt="">
            {{ t('app.account') }}
          </span>
          <span class="mobile-nav-label">{{ t('app.mobileAccount') }}</span>
        </NuxtLink>
        <NuxtLink
          v-else
          class="nav-link mobile-nav-link account-nav"
          :class="{ 'is-current-section': isNavigationSectionActive('account') }"
          :to="$localePath({ name: 'account-sign-in' })"
          :aria-label="t('app.signIn')"
          :aria-current="isNavigationSectionActive('account') ? 'page' : undefined"
        >
          <span class="mobile-nav-icon i-lucide-user-round" aria-hidden="true" />
          <span class="desktop-nav-label">{{ t('app.signIn') }}</span>
          <span class="mobile-nav-label">{{ t('app.mobileAccount') }}</span>
        </NuxtLink>
      </nav>
      <div class="header-tools">
        <div
          v-if="loggedIn && user?.role === 'admin'"
          ref="adminMenu"
          class="admin-menu"
          @keydown.esc.prevent.stop="closeAdminMenuAndFocus"
        >
          <button
            ref="adminMenuTrigger"
            class="nav-link admin-nav admin-menu-trigger"
            type="button"
            :aria-controls="adminMenuOpen ? 'admin-menu-options' : undefined"
            :aria-expanded="adminMenuOpen"
            @click="adminMenuOpen = !adminMenuOpen"
          >
            {{ t('app.admin') }}
            <span class="i-lucide-chevron-down admin-menu-chevron" aria-hidden="true" />
          </button>
          <Transition name="menu-pop">
            <div v-if="adminMenuOpen" id="admin-menu-options" class="admin-menu-panel">
              <NuxtLink :to="$localePath({ name: 'admin-calendar' })" @click="dismissAdminMenu">{{ t('admin.calendarTitle') }}</NuxtLink>
              <NuxtLink :to="$localePath('/admin/master')" @click="dismissAdminMenu">{{ t('app.configureMaster') }}</NuxtLink>
            </div>
          </Transition>
        </div>
        <div class="language-control">
          <button class="language-switcher" type="button" :disabled="preferences.saving.value" :aria-busy="preferences.saving.value" :aria-label="t('app.switchLanguage', { language: nextLanguageLabel })" @click="switchLanguage">
            {{ nextLanguageCode }}
          </button>
          <Transition name="menu-pop">
            <span v-if="languageSaveError" class="language-save-status" role="status">{{ t('app.languageSaveError') }}</span>
          </Transition>
        </div>
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
          <Transition name="menu-pop">
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
      </div>
    </header>
    <AccountSectionNavigation v-if="showAccountNavigation" />
    <NuxtPage :page-key="route => route.fullPath" />
    <footer class="site-footer page-wrap">
      <NuxtLink class="site-footer-about" :to="$localePath({ name: 'about' })">{{ t('app.about') }}</NuxtLink>
      <NuxtLink class="site-footer-leaderboard" :to="$localePath({ name: 'leaderboard' })">{{ t('app.leaderboard') }}</NuxtLink>
      <span>{{ t('app.footerLine') }} <a href="https://zimablue.cc" target="_blank" rel="noreferrer">Zimablue</a>.</span>
      <span>{{ t('app.footerTagline') }}</span>
      <span class="site-footer-version">v{{ appVersion }}</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
type ThemePreference = 'system' | 'light' | 'dark'

const { loggedIn, user } = useUserSession()
const route = useRoute()
const preferences = useAccountPreferences()
const { public: { appVersion } } = useRuntimeConfig()
const { $getLocale, $localePath, $switchLocale, $t } = useI18n()
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
const adminMenu = ref<HTMLElement>()
const adminMenuTrigger = ref<HTMLButtonElement>()
const adminMenuOpen = ref(false)
const languageSaveError = ref(false)
const navBarsHidden = ref(false)
const isMobileViewport = ref(false)
let mobileViewportQuery: MediaQueryList | undefined
let previousScrollY = 0
let scrollDirection = 0
let scrollDirectionDistance = 0
let scrollFrame = 0
const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'theme.system' },
  { value: 'light', label: 'theme.light' },
  { value: 'dark', label: 'theme.dark' },
]
const showAccountNavigation = computed(() => loggedIn.value && (
  route.path === $localePath({ name: 'account' })
  || route.path === $localePath({ name: 'account-settings' })
))
const routeName = computed(() => String(route.name ?? '').split('___')[0] ?? '')
const isGameplayRoute = computed(() => routeName.value === 'play' || routeName.value === 'master')
const themeLabels = computed(() => Object.fromEntries(themeOptions.map(option => [option.value, t(option.label)])) as Record<ThemePreference, string>)
const currentLanguage = computed(() => $getLocale())
const nextLanguageCode = computed(() => currentLanguage.value === 'fr' ? 'EN' : 'FR')
const nextLanguageLabel = computed(() => currentLanguage.value === 'fr' ? 'English' : 'Français')

useHead({
  htmlAttrs: { 'data-theme': theme, 'data-reduced-motion': computed(() => preferences.preferences.value.reduceMotion ? 'true' : 'false') },
  meta: [{ name: 'msvalidate.01', content: '6D24C120FDA31CA11DDE69DCCFF499A7' }],
})
useSeoMeta({ ogSiteName: 'Puzzle Zimablue' })

function setTheme(value: ThemePreference) {
  themeCookie.value = value
  themeMenuOpen.value = false
}

function isNavigationSectionActive(section: 'home' | 'master' | 'archive' | 'account') {
  const name = routeName.value
  if (section === 'home') return name === 'index' || name === 'play'
  if (section === 'master') return name === 'master' || name.startsWith('master-')
  if (section === 'archive') return name === 'archive' || name === 'leaderboard-puzzle'
  return name === 'account' || name.startsWith('account-')
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

function dismissAdminMenu() {
  adminMenuOpen.value = false
}

function closeAdminMenuOnOutsideClick(event: PointerEvent) {
  if (event.target instanceof Node && !adminMenu.value?.contains(event.target)) {
    dismissAdminMenu()
  }
}

function closeAdminMenuAndFocus() {
  dismissAdminMenu()
  adminMenuTrigger.value?.focus()
}

onMounted(() => {
  void loadAndApplyLanguagePreference()
  mobileViewportQuery = window.matchMedia('(max-width: 760px)')
  isMobileViewport.value = mobileViewportQuery.matches
  previousScrollY = window.scrollY
  mobileViewportQuery.addEventListener('change', onMobileViewportChange)
  window.addEventListener('scroll', scheduleNavigationVisibilityUpdate, { passive: true })
  document.addEventListener('pointerdown', closeThemeMenu)
  document.addEventListener('keydown', closeThemeMenu)
  document.addEventListener('pointerdown', closeAdminMenuOnOutsideClick)
})

watch(loggedIn, (isLoggedIn, wasLoggedIn) => {
  if (isLoggedIn === wasLoggedIn) return
  void loadAndApplyLanguagePreference()
})

onBeforeUnmount(() => {
  mobileViewportQuery?.removeEventListener('change', onMobileViewportChange)
  window.removeEventListener('scroll', scheduleNavigationVisibilityUpdate)
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
  document.removeEventListener('pointerdown', closeThemeMenu)
  document.removeEventListener('keydown', closeThemeMenu)
  document.removeEventListener('pointerdown', closeAdminMenuOnOutsideClick)
})

watch(() => route.fullPath, async () => {
  showNavigationBars()
  await nextTick()
  previousScrollY = window.scrollY
})

function resetScrollDirection() {
  previousScrollY = window.scrollY
  scrollDirection = 0
  scrollDirectionDistance = 0
}

function showNavigationBars() {
  navBarsHidden.value = false
  scrollDirection = 0
  scrollDirectionDistance = 0
}

function onMobileViewportChange(event: MediaQueryListEvent) {
  isMobileViewport.value = event.matches
  showNavigationBars()
  resetScrollDirection()
}

function scheduleNavigationVisibilityUpdate() {
  if (scrollFrame) return
  scrollFrame = window.requestAnimationFrame(updateNavigationVisibility)
}

function updateNavigationVisibility() {
  scrollFrame = 0
  const currentScrollY = Math.max(0, window.scrollY)
  const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  const isAtPageEdge = currentScrollY <= 8 || maxScrollY <= 8 || maxScrollY - currentScrollY <= 8

  if (!isMobileViewport.value || isAtPageEdge) {
    showNavigationBars()
    previousScrollY = currentScrollY
    return
  }

  const delta = currentScrollY - previousScrollY
  previousScrollY = currentScrollY
  if (Math.abs(delta) < 1) return

  const nextDirection = Math.sign(delta)
  if (nextDirection !== scrollDirection) {
    scrollDirection = nextDirection
    scrollDirectionDistance = Math.abs(delta)
  }
  else {
    scrollDirectionDistance += Math.abs(delta)
  }

  const threshold = scrollDirection > 0 ? 40 : 12
  if (scrollDirectionDistance < threshold) return

  const activeElement = document.activeElement
  const keyboardFocusInHeader = activeElement instanceof HTMLElement
    && activeElement.matches(':focus-visible')
    && activeElement.closest('.site-header')
  const menuIsOpen = adminMenuOpen.value || themeMenuOpen.value || languageSaveError.value

  if (scrollDirection > 0) {
    if (currentScrollY > 88 && !keyboardFocusInHeader && !menuIsOpen) navBarsHidden.value = true
  }
  else {
    navBarsHidden.value = false
  }

  scrollDirectionDistance = 0
}

async function loadAndApplyLanguagePreference() {
  if (loggedIn.value) await preferences.loadAccount()
  else preferences.loadGuest()

  const preferredLanguage = preferences.preferences.value.preferredLanguage
  const shouldApplyPreference = preferences.source.value === 'account' || currentLanguage.value === 'fr'
  if (shouldApplyPreference && currentLanguage.value !== preferredLanguage) $switchLocale(preferredLanguage)
}

async function switchLanguage() {
  const nextLanguage = currentLanguage.value === 'fr' ? 'en' : 'fr'
  languageSaveError.value = false
  const saved = await preferences.save({ preferredLanguage: nextLanguage })
  if (!saved) {
    languageSaveError.value = true
    return
  }
  $switchLocale(nextLanguage)
}

</script>
