<template>
  <main class="auth-page">
    <section class="auth-sheet auth-sign-up">
      <NuxtLink :to="gameReturnTo" class="auth-back">{{ t('auth.back') }}</NuxtLink>
      <h1>{{ t('account.createAccount') }}</h1>
      <p class="auth-intro">{{ t('account.registrationDescription') }}</p>
      <p v-if="puzzleDate" class="auth-confirmation account-puzzle-claim">{{ t('account.claimedPuzzle', { date: formatPuzzleDate(puzzleDate, { dateStyle: 'medium' }, dateLocale) }) }}</p>
      <form v-if="!sent" class="auth-form" @submit.prevent="register">
        <label>{{ t('auth.email') }}<input v-model="email" type="email" autocomplete="email" required></label>
        <label>{{ t('auth.password') }}<input v-model="password" type="password" autocomplete="new-password" minlength="12" required><small class="auth-field-help">{{ t('auth.passwordMinimum') }}</small></label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="admin-primary" :disabled="busy">{{ busy ? t('auth.creating') : t('account.createAccount') }}</button>
      </form>
      <p v-else class="auth-confirmation" role="status">{{ t('account.verificationSent') }}</p>
      <p class="account-secondary-link">{{ t('account.alreadyHaveAccount') }} <NuxtLink :to="$localePath({ name: 'account-sign-in', query: signInQuery })">{{ t('auth.login') }}</NuxtLink></p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { formatPuzzleDate } from '#shared/types/puzzle'
definePageMeta({ name: 'account-sign-up', layout: false })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/account/sign-up' } })
const { $getLocale, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const dateLocale = computed(() => $getLocale() === 'en' ? 'en-US' : 'fr-FR')
const { accountQuery: signInQuery, gameReturnTo, puzzleAttempt, puzzleDate } = useAccountAuthContext()
const email = ref('')
const password = ref('')
const error = ref('')
const sent = ref(false)
const busy = ref(false)
async function register() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: { email: email.value, password: password.value, locale: $getLocale(), ...(puzzleDate.value && puzzleAttempt.value ? { puzzleDate: puzzleDate.value, attempt: puzzleAttempt.value } : {}) },
    })
    sent.value = true
  } catch (cause: any) {
    error.value = cause?.data?.statusMessage || t('account.registrationError')
  } finally {
    busy.value = false
  }
}
</script>
