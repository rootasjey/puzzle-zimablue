<template>
  <main class="account-page">
    <section v-if="loggedIn" class="account-content">
      <NuxtLink class="auth-back" :to="$localePath({ name: 'index' })">{{ t('auth.back') }}</NuxtLink>
      <nav class="account-section-nav" :aria-label="t('account.sectionNavigation')">
        <NuxtLink :to="$localePath({ name: 'account' })">{{ t('account.progressTab') }}</NuxtLink>
        <NuxtLink :to="$localePath({ name: 'account-settings' })" aria-current="page">{{ t('settings.title') }}</NuxtLink>
      </nav>
      <h1>{{ t('settings.title') }}</h1>
      <p class="auth-intro">{{ t('settings.description') }}</p>

      <form :aria-busy="!preferences.loaded.value" @submit.prevent="saveSettings">
        <p v-if="!preferences.loaded.value" class="auth-intro" role="status">{{ t('settings.loading') }}</p>
        <fieldset class="settings-fieldset" :disabled="!preferences.loaded.value || preferences.saving.value">
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
          <div class="settings-avatars" role="group" :aria-label="t('settings.avatarTitle')">
            <button
              v-for="variant in avatarVariants"
              :key="variant"
              class="settings-avatar-option"
              type="button"
              :aria-pressed="draft.avatarVariant === variant"
              @click="draft.avatarVariant = variant"
            >
              <img :src="preferences.avatarUrl(variant, 112)" alt="" loading="lazy">
              <span>{{ t(`settings.avatarVariants.${variant}`) }}</span>
            </button>
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
import { DEFAULT_ACCOUNT_PREFERENCES, TRONCHE_AVATAR_VARIANTS, type AccountPreferences, type TroncheAvatarVariant } from '#shared/types/account-preferences'

interface AccountProfileStats { publicName: string; publicProfileToken: string | null }
definePageMeta({ name: 'account-settings' })
const { $defineI18nRoute, $localePath } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/account/settings' } })
const { $t } = useI18n()
const t = (key: string): string => String($t(key as any) ?? '')
const { loggedIn, fetch } = useUserSession()
const { data: stats, error: statsError, refresh: refreshStats } = await useFetch<AccountProfileStats>('/api/account/stats', { immediate: loggedIn.value })
const preferences = useAccountPreferences()
const avatarVariants = TRONCHE_AVATAR_VARIANTS
const draft = reactive<AccountPreferences>({ ...DEFAULT_ACCOUNT_PREFERENCES })
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
})

async function saveSettings() {
  saved.value = false
  saveError.value = false
  const ok = await preferences.save({ ...draft })
  if (!ok) {
    saveError.value = true
    return
  }
  Object.assign(draft, preferences.preferences.value)
  saved.value = true
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
