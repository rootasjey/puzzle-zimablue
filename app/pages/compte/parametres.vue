<template>
  <main class="account-page">
    <section v-if="loggedIn" class="account-content auth-sheet settings-sheet">
      <NuxtLink class="auth-back" :to="$localePath({ name: 'account' })">{{ t('settings.back') }}</NuxtLink>
      <p class="section-kicker">{{ t('account.kicker') }}</p>
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

definePageMeta({ name: 'account-settings' })
const { $defineI18nRoute, $localePath } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/account/settings' } })
const { $t } = useI18n()
const t = (key: string): string => String($t(key as any) ?? '')
const { loggedIn, fetch } = useUserSession()
const preferences = useAccountPreferences()
const avatarVariants = TRONCHE_AVATAR_VARIANTS
const draft = reactive<AccountPreferences>({ ...DEFAULT_ACCOUNT_PREFERENCES })
const saved = ref(false)
const saveError = ref(false)

onMounted(async () => {
  await fetch()
  if (!loggedIn.value) return
  await preferences.loadAccount()
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
</script>
