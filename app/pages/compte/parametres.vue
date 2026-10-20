<template>
  <main class="account-page">
    <section v-if="loggedIn" class="account-content">
      <h1>{{ t('settings.title') }}</h1>
      <p class="auth-intro">{{ t('settings.description') }}</p>

      <form :aria-busy="!preferences.loaded.value" @submit.prevent="saveSettings">
        <p v-if="!preferences.loaded.value" class="auth-intro" role="status">{{ t('settings.loading') }}</p>
        <fieldset class="settings-fieldset" :disabled="!preferences.loaded.value || preferences.saving.value">
        <section class="settings-section" aria-labelledby="settings-language-title">
          <h2 id="settings-language-title">{{ t('settings.languageTitle') }}</h2>
          <p>{{ t('settings.languageHelp') }}</p>
          <div class="settings-language-options" role="radiogroup" aria-labelledby="settings-language-title">
            <label class="settings-language-option">
              <input v-model="draft.preferredLanguage" type="radio" name="preferred-language" value="fr">
              <span lang="fr">Français</span>
            </label>
            <label class="settings-language-option">
              <input v-model="draft.preferredLanguage" type="radio" name="preferred-language" value="en">
              <span lang="en">English</span>
            </label>
          </div>
        </section>

        <section class="settings-section" aria-labelledby="settings-game-title">
          <h2 id="settings-game-title">{{ t('settings.gameTitle') }}</h2>
          <label class="settings-toggle">
            <input v-model="draft.showReferenceImage" type="checkbox">
            <span><strong>{{ t('settings.showReference') }}</strong><small>{{ t('settings.referenceHelp') }}</small></span>
          </label>
          <label class="settings-toggle">
            <input v-model="draft.reduceMotion" type="checkbox">
            <span><strong>{{ t('settings.reduceMotion') }}</strong><small>{{ t('settings.reduceMotionHelp') }}</small></span>
          </label>
          <label class="settings-toggle">
            <input v-model="draft.soundEnabled" type="checkbox">
            <span><strong>{{ t('settings.soundEnabled') }}</strong><small>{{ t('settings.soundHelp') }}</small></span>
          </label>
          <div class="settings-volume">
            <label for="puzzle-sound-volume">{{ t('settings.soundVolume') }}</label>
            <output for="puzzle-sound-volume">{{ draft.soundVolume }}%</output>
            <input id="puzzle-sound-volume" v-model.number="draft.soundVolume" type="range" min="0" max="100" step="1" :disabled="!draft.soundEnabled">
          </div>
        </section>

        <section class="settings-section" aria-labelledby="settings-avatar-title">
          <h2 id="settings-avatar-title">{{ t('settings.avatarTitle') }}</h2>
          <p>{{ t('settings.avatarHelp') }}</p>
          <div class="settings-avatar-palettes" role="group" :aria-label="t('settings.avatarPaletteTitle')">
            <button
              v-for="palette in avatarPalettes"
              :key="palette.id"
              class="settings-avatar-palette"
              type="button"
              :aria-label="t(`settings.avatarPalettes.${palette.id}`)"
              :aria-pressed="isPaletteSelected(palette.colors)"
              @click="draft.avatarColors = [...palette.colors]"
            >
              <span class="settings-avatar-swatches" aria-hidden="true">
                <i v-for="color in palette.colors" :key="color" :style="{ backgroundColor: color }" />
              </span>
              <span>{{ t(`settings.avatarPalettes.${palette.id}`) }}</span>
            </button>
          </div>
          <div class="settings-avatars" role="group" :aria-label="t('settings.avatarTitle')">
            <button
              v-for="variant in avatarVariants"
              :key="variant"
              class="settings-avatar-option"
              type="button"
              :aria-pressed="draft.avatarVariant === variant"
              @click="draft.avatarVariant = variant"
            >
              <img :src="preferences.avatarUrl(variant, 112, draft.avatarColors)" alt="" loading="lazy">
              <span>{{ t(`settings.avatarVariants.${variant}`) }}</span>
            </button>
          </div>
          <div class="settings-avatar-import">
            <div class="settings-avatar-import-heading">
              <div>
                <h3>{{ t('settings.avatarImportTitle') }}</h3>
                <p>{{ t('settings.avatarImportHelp') }}</p>
              </div>
              <a class="soft-link" href="https://tronche.cc/playground" target="_blank" rel="noopener noreferrer">
                {{ t('settings.avatarOpenPlayground') }} <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div class="settings-avatar-import-row">
              <label for="tronche-playground-url">{{ t('settings.avatarUrlLabel') }}</label>
              <div class="settings-avatar-url-control">
                <input
                  id="tronche-playground-url"
                  v-model="troncheUrlInput"
                  type="url"
                  inputmode="url"
                  autocomplete="url"
                  :placeholder="t('settings.avatarUrlPlaceholder')"
                  :aria-invalid="Boolean(avatarImportError)"
                  @keydown.enter.prevent="importAvatarConfiguration"
                >
                <button class="admin-secondary" type="button" @click="importAvatarConfiguration">{{ t('settings.avatarImportButton') }}</button>
              </div>
            </div>
            <p v-if="avatarImportError" class="form-error" role="alert">{{ t('settings.avatarImportError') }}</p>
            <p v-else-if="avatarImported" class="settings-avatar-imported" role="status">{{ t('settings.avatarImported') }}</p>
          </div>
        </section>

        <p v-if="saveError" class="form-error" role="alert">{{ t('settings.saveError') }}</p>
        <p v-if="saved" class="auth-confirmation" role="status">{{ t('settings.saved') }}</p>
        <button class="admin-primary settings-save" type="submit">{{ preferences.saving.value ? t('settings.saving') : t('settings.save') }}</button>
        </fieldset>
      </form>

      <section class="settings-section settings-profile-section" aria-labelledby="settings-profile-title">
        <h2 id="settings-profile-title">{{ t('account.profileSettingsTitle') }}</h2>
        <p>{{ t('account.profileSettingsHelp') }}</p>
        <p v-if="statsError" class="form-error" role="alert">{{ t('account.loadError') }}</p>
        <template v-else-if="stats">
          <section class="settings-profile-subsection" aria-labelledby="public-name-title">
            <h3 id="public-name-title">{{ t('account.publicNameTitle') }}</h3>
            <p>{{ t('account.publicNameHelp') }}</p>
            <form class="account-public-form" @submit.prevent="savePublicName">
              <label>{{ t('account.publicNameLabel') }}<input v-model="publicName" type="text" maxlength="24" autocomplete="nickname"></label>
              <p v-if="profileError" class="form-error" role="alert">{{ profileError }}</p>
              <p v-if="profileSaved" class="auth-confirmation" role="status">{{ profileSaved }}</p>
              <button class="admin-primary" type="submit" :disabled="profileBusy">{{ profileBusy ? t('account.savingPublicName') : t('account.savePublicName') }}</button>
            </form>
          </section>

          <section class="settings-profile-subsection" aria-labelledby="public-profile-title">
            <h3 id="public-profile-title">{{ t('account.publicProfileTitle') }}</h3>
            <p>{{ t('account.publicProfileHelp') }}</p>
            <label class="account-public-toggle">
              <input v-model="publicProfileDraft" type="checkbox" :disabled="publicProfileBusy">
              <span>{{ t('account.publicProfileToggle') }}</span>
            </label>
            <p v-if="publicProfileDraft && !stats.publicName" class="account-public-hint">{{ t('account.publicProfileNeedsName') }}</p>
            <p v-if="publicProfileError" class="form-error" role="alert">{{ publicProfileError }}</p>
            <p v-if="publicProfileSaved" class="auth-confirmation" role="status">{{ publicProfileSaved }}</p>
            <div class="account-public-actions">
              <button
                class="admin-primary"
                type="button"
                :disabled="publicProfileBusy || publicProfileDraft === isPublicProfile || (publicProfileDraft && !stats.publicName)"
                @click="savePublicProfile"
              >
                {{ publicProfileBusy ? t('account.savingPublicProfile') : t(publicProfileActionLabel) }}
              </button>
              <NuxtLink
                v-if="isPublicProfile && stats.publicProfileToken"
                class="soft-link"
                :to="$localePath({ name: 'public-player-profile', params: { token: stats.publicProfileToken } })"
                target="_blank"
              >
                {{ t('account.viewPublicProfile') }} <span aria-hidden="true">↗</span>
              </NuxtLink>
            </div>
          </section>
        </template>
      </section>
    </section>
    <section v-else class="auth-sheet account-welcome">
      <NuxtLink :to="$localePath({ name: 'index' })" class="auth-back">{{ t('auth.back') }}</NuxtLink>
      <p class="section-kicker">{{ t('account.kicker') }}</p>
      <h1>{{ t('settings.title') }}</h1>
      <p class="auth-intro">{{ t('settings.signInRequired') }}</p>
      <NuxtLink class="admin-primary" :to="$localePath({ name: 'account-sign-in' })">{{ t('auth.login') }}</NuxtLink>
    </section>
  </main>
</template>

<script setup lang="ts">
import { DEFAULT_ACCOUNT_PREFERENCES, normalizeTroncheAvatarColors, TRONCHE_AVATAR_VARIANTS, type AccountPreferences, type TroncheAvatarVariant } from '#shared/types/account-preferences'

interface AccountProfileStats { publicName: string; publicProfileToken: string | null }
definePageMeta({ name: 'account-settings' })
const { $defineI18nRoute, $localePath } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/account/settings' } })
const { $getLocale, $switchLocale, $t } = useI18n()
const t = (key: string): string => String($t(key as any) ?? '')
const { loggedIn, fetch } = useUserSession()
const { data: stats, error: statsError, refresh: refreshStats } = await useFetch<AccountProfileStats>('/api/account/stats', { immediate: loggedIn.value })
const preferences = useAccountPreferences()
const avatarVariants = TRONCHE_AVATAR_VARIANTS
const avatarPalettes = [
  { id: 'blue', colors: ['#1B4EF5', '#3874FF', '#5996FF', '#F4CEFF', '#9FA1FF'] },
  { id: 'pop', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FEEAA7'] },
  { id: 'lavender', colors: ['#6B5CE7', '#A29BFE', '#FD79A8', '#FDCB6E', '#E27055'] },
  { id: 'earth', colors: ['#F5F5DC', '#FBC02D', '#FF8F00', '#C62828', '#F1DEC4'] },
  { id: 'sunshine', colors: ['#FF6B6B', '#EE5A24', '#F0932B', '#FFBE76', '#BADC58'] },
  { id: 'candy', colors: ['#FFCA95', '#FF7873', '#E22F80', '#8140DC', '#FBEFEF'] },
] as const
const draft = reactive<AccountPreferences>({ ...DEFAULT_ACCOUNT_PREFERENCES })
const troncheUrlInput = ref('')
const avatarImportError = ref(false)
const avatarImported = ref(false)
const saved = ref(false)
const saveError = ref(false)
const profileBusy = ref(false)
const publicName = ref('')
const profileError = ref('')
const profileSaved = ref('')
const publicProfileDraft = ref(false)
const publicProfileBusy = ref(false)
const publicProfileError = ref('')
const publicProfileSaved = ref('')
const isPublicProfile = computed(() => Boolean(stats.value?.publicProfileToken))
const publicProfileActionLabel = computed(() => publicProfileDraft.value === isPublicProfile.value
  ? isPublicProfile.value ? 'account.publicProfileOn' : 'account.publicProfileOff'
  : publicProfileDraft.value ? 'account.makeProfilePublic' : 'account.makeProfilePrivate')
watch(() => stats.value?.publicName, value => { publicName.value = value ?? '' }, { immediate: true })
watch(isPublicProfile, value => { publicProfileDraft.value = value }, { immediate: true })

onMounted(async () => {
  await fetch()
  if (!loggedIn.value) return
  await Promise.all([preferences.loadAccount(), refreshStats()])
  Object.assign(draft, preferences.preferences.value)
  draft.preferredLanguage = $getLocale() === 'en' ? 'en' : 'fr'
})

async function saveSettings() {
  saved.value = false
  saveError.value = false
  const selectedLanguage = draft.preferredLanguage
  const ok = await preferences.save({ ...draft })
  if (!ok) {
    saveError.value = true
    return
  }
  Object.assign(draft, preferences.preferences.value)
  saved.value = true
  if ($getLocale() !== selectedLanguage) $switchLocale(selectedLanguage)
}

function isPaletteSelected(colors: readonly string[]) {
  return draft.avatarColors.length === colors.length && draft.avatarColors.every((color, index) => color === colors[index])
}

function importAvatarConfiguration() {
  avatarImportError.value = false
  avatarImported.value = false

  try {
    const url = new URL(troncheUrlInput.value.trim())
    const validHost = url.protocol === 'https:' && url.hostname === 'tronche.cc' && !url.port && !url.username && !url.password
    const isPlayground = url.pathname === '/playground' || url.pathname === '/playground/'
    const isAvatarApi = /^\/api\/avatar\/[^/]+\/?$/.test(url.pathname)
    if (!validHost || (!isPlayground && !isAvatarApi)) throw new Error('Invalid Tronche URL')

    const requestedVariant = url.searchParams.get('variant')
    const defaultVariant: TroncheAvatarVariant = isPlayground ? 'beam' : 'marble'
    if (requestedVariant && !(avatarVariants as readonly string[]).includes(requestedVariant)) throw new Error('Invalid Tronche variant')

    const rawColors = url.searchParams.get('colors')
    const colors = rawColors ? normalizeTroncheAvatarColors(rawColors.split(',')) : []
    if (colors === null) throw new Error('Invalid Tronche colors')

    draft.avatarVariant = (requestedVariant || defaultVariant) as TroncheAvatarVariant
    draft.avatarColors = colors
    avatarImported.value = true
  } catch {
    avatarImportError.value = true
  }
}

async function savePublicName() {
  profileBusy.value = true
  profileError.value = ''
  profileSaved.value = ''
  try {
    const result = await $fetch<{ publicName: string }>('/api/account/profile', { method: 'POST', body: { publicName: publicName.value } })
    publicName.value = result.publicName
    if (stats.value) stats.value.publicName = result.publicName
    profileSaved.value = t('account.publicNameSaved')
  } catch (cause: any) {
    profileError.value = cause?.statusCode === 409 ? t('account.publicNameDisableProfileFirst') : cause?.data?.statusMessage || t('account.publicNameError')
  } finally {
    profileBusy.value = false
  }
}

async function savePublicProfile() {
  publicProfileBusy.value = true
  publicProfileError.value = ''
  publicProfileSaved.value = ''
  try {
    const result = await $fetch<{ enabled: boolean; token: string | null }>('/api/account/public-profile', {
      method: 'POST',
      body: { enabled: publicProfileDraft.value },
    })
    if (stats.value) stats.value.publicProfileToken = result.token
    publicProfileDraft.value = result.enabled
    publicProfileSaved.value = t(result.enabled ? 'account.publicProfileEnabledNotice' : 'account.publicProfileDisabledNotice')
  } catch (cause: any) {
    publicProfileError.value = cause?.statusCode === 409
      ? t('account.publicProfileNeedsName')
      : cause?.data?.statusMessage || t('account.publicProfileError')
  } finally {
    publicProfileBusy.value = false
  }
}
</script>

<style>
.settings-section { margin-top: 1.7rem; padding-top: 1.3rem; border-top: 1px solid var(--line-divider); }
.settings-fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
.settings-fieldset:disabled { opacity: .6; }
.settings-section h2 { margin: 0; font-size: 1.15rem; font-weight: 850; }
.settings-section > p { max-width: 58ch; margin: .45rem 0 1rem; color: var(--muted); font-size: .86rem; line-height: 1.6; }
.settings-profile-section { margin-top: 2.2rem; }
.settings-profile-section > h2 { font-size: 1.3rem; }
.settings-profile-subsection { margin-top: 1.7rem; }
.settings-profile-subsection + .settings-profile-subsection { padding-top: 1.4rem; border-top: 1px solid var(--line-divider); }
.settings-profile-subsection h3 { margin: 0; font-size: 1rem; font-weight: 800; }
.settings-profile-subsection > p { max-width: 58ch; margin: .4rem 0 .9rem; color: var(--muted); font-size: .84rem; line-height: 1.6; }
.settings-toggle { display: flex; align-items: flex-start; gap: .7rem; margin: 1rem 0; cursor: pointer; }
.settings-toggle input { width: 1.15rem; height: 1.15rem; flex: none; margin: .1rem 0 0; accent-color: var(--blue); }
.settings-toggle span { display: grid; gap: .2rem; }
.settings-toggle strong { font-size: .9rem; }
.settings-toggle small { color: var(--muted); font-size: .77rem; line-height: 1.5; }
.settings-language-options { display: flex; flex-wrap: wrap; gap: .65rem; margin-top: .8rem; }
.settings-language-option { display: flex; min-height: 2.75rem; align-items: center; gap: .55rem; padding: .5rem .75rem; border: 2px solid var(--line-divider); background: var(--white); cursor: pointer; transition: border-color .16s ease, background-color .16s ease; }
.settings-language-option:has(input:checked) { border-color: var(--ink); background: var(--yellow); color: var(--yellow-foreground); }
.settings-language-option input { width: 1rem; height: 1rem; margin: 0; accent-color: var(--blue); }
.settings-language-option span { font-size: .85rem; font-weight: 750; }
.settings-volume { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: .3rem 1rem; margin-top: 1rem; }
.settings-volume label { font-size: .88rem; font-weight: 750; }
.settings-volume output { color: var(--muted); font-size: .82rem; font-variant-numeric: tabular-nums; }
.settings-volume input { grid-column: 1 / -1; width: 100%; accent-color: var(--blue); }
.settings-avatars { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .6rem; }
.settings-avatar-option { display: grid; min-width: 0; min-height: 7.5rem; justify-items: center; align-content: center; gap: .5rem; padding: .7rem; border: 2px solid var(--line); background: var(--white); color: var(--ink); font: inherit; font-size: .78rem; font-weight: 750; cursor: pointer; }
.settings-avatar-option[aria-pressed="true"] { border-color: var(--blue); box-shadow: 0 0 0 2px var(--paper), 0 0 0 4px var(--blue); }
.settings-avatar-option img { display: block; width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }
.settings-avatar-palettes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .5rem; margin: 1rem 0; }
.settings-avatar-palette { display: flex; min-width: 0; min-height: 2.8rem; align-items: center; gap: .5rem; padding: .45rem .6rem; border: 2px solid var(--line); background: var(--white); color: var(--ink); font: inherit; font-size: .72rem; font-weight: 750; text-align: left; cursor: pointer; }
.settings-avatar-palette[aria-pressed="true"] { border-color: var(--blue); box-shadow: inset 0 0 0 1px var(--blue); }
.settings-avatar-palette:focus-visible,.settings-avatar-option:focus-visible { outline: 3px solid var(--coral); outline-offset: 2px; }
.settings-avatar-swatches { display: flex; flex: none; }
.settings-avatar-swatches i { width: .72rem; height: .72rem; margin-left: -.13rem; border: 1px solid var(--white); border-radius: 50%; }
.settings-avatar-swatches i:first-child { margin-left: 0; }
.settings-avatar-import { display: grid; gap: .8rem; margin-top: 1.2rem; padding: 1rem; border: 1px solid var(--line); background: color-mix(in srgb, var(--white) 55%, transparent); }
.settings-avatar-import-heading { display: flex; align-items: start; justify-content: space-between; gap: 1rem; }
.settings-avatar-import-heading h3 { margin: 0; font-size: .9rem; font-weight: 800; }
.settings-avatar-import-heading p { margin: .3rem 0 0; color: var(--muted); font-size: .78rem; line-height: 1.5; }
.settings-avatar-import-heading .soft-link { flex: none; color: var(--blue); font-size: .76rem; }
.settings-avatar-import-heading .soft-link:hover { color: var(--coral); }
.settings-avatar-import-heading .soft-link:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.settings-avatar-import-row { display: grid; gap: .4rem; }
.settings-avatar-import-row > label { color: var(--ink); font-size: .78rem; font-weight: 750; }
.settings-avatar-url-control { display: flex; align-items: stretch; gap: .55rem; }
.settings-avatar-url-control input { min-width: 0; min-height: 2.8rem; flex: 1; padding: .6rem .7rem; border: 2px solid var(--ink); border-radius: 0; background: var(--white); color: var(--ink); font: inherit; font-size: .8rem; }
.settings-avatar-url-control input:focus { outline: 3px solid var(--yellow); outline-offset: 2px; }
.settings-avatar-imported { margin: 0; color: var(--success-foreground); font-size: .78rem; font-weight: 700; }
.settings-save { margin-top: 1.5rem; }
@media (max-width: 520px) {
  .settings-avatars,.settings-avatar-palettes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .settings-avatar-import-heading { flex-direction: column; }
  .settings-avatar-url-control { align-items: stretch; flex-direction: column; } }
.account-public-toggle { display: flex; max-width: 600px; align-items: start; gap: .7rem; color: var(--ink); font-size: .86rem; font-weight: 750; line-height: 1.45; cursor: pointer; }
.account-public-toggle input { width: 1.15rem; height: 1.15rem; flex: none; margin: .08rem 0 0; accent-color: var(--blue); }
.account-public-toggle input:focus-visible { outline: 3px solid var(--yellow); outline-offset: 3px; }
.account-public-hint { margin: .65rem 0 0 !important; color: var(--yellow-foreground) !important; font-size: .8rem !important; }
.account-public-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .9rem; margin-top: .9rem; }
.account-public-actions .admin-primary { min-height: 2.8rem; }
.account-public-actions .soft-link { font-size: .82rem; font-weight: 750; }
.account-public-form { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: .75rem; max-width: 600px; }
.account-public-form label { display: grid; gap: .4rem; color: var(--ink); font-size: .82rem; font-weight: 750; }
.account-public-form input { width: 100%; min-height: 2.8rem; padding: .65rem .75rem; border: 2px solid var(--ink); border-radius: 0; background: var(--white); color: var(--ink); font: inherit; font-size: .9rem; }
.account-public-form input:focus { outline: 3px solid var(--yellow); outline-offset: 2px; }
.account-public-form .form-error, .account-public-form .auth-confirmation { grid-column: 1 / -1; }
@media (max-width: 600px) {
  .account-public-form { grid-template-columns: 1fr; } }
</style>
