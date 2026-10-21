<template>
  <main class="auth-page">
    <section class="auth-sheet auth-sign-in">
      <NuxtLink :to="gameReturnTo" class="auth-back">{{ t('auth.back') }}</NuxtLink>
      <h1>{{ t('auth.loginTitle') }}</h1>
      <form class="auth-form" @submit.prevent="login">
        <label>{{ t('auth.email') }}<input v-model="email" type="email" autocomplete="username" required></label>
        <label>{{ t('auth.password') }}<input v-model="password" type="password" autocomplete="current-password" required></label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="admin-primary" :disabled="busy">{{ busy ? t('auth.loggingIn') : t('auth.login') }}</button>
      </form>
      <NuxtLink class="auth-small-link" :to="$localePath({ name: 'account-forgot-password', query: accountQuery })">{{ t('auth.forgot') }}</NuxtLink>
      <p v-if="puzzleDate" class="auth-confirmation account-puzzle-claim">{{ t('account.claimedPuzzle', { date: formatPuzzleDate(puzzleDate, { dateStyle: 'medium' }, dateLocale) }) }}</p>
      <p class="account-secondary-link">{{ t('account.noAccount') }} <NuxtLink :to="$localePath({ name: 'account-sign-up', query: accountQuery })">{{ t('account.createAccount') }}</NuxtLink></p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { formatPuzzleDate } from '#shared/types/puzzle'
definePageMeta({ name: 'account-sign-in', layout: false })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/account/sign-in' } })
const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)
const { fetch } = useUserSession()
const { $t } = useI18n()
const { $getLocale } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const dateLocale = computed(() => $getLocale() === 'en' ? 'en-US' : 'fr-FR')
const { accountQuery, gameReturnTo, puzzleAttempt, puzzleDate, returnToMaster } = useAccountAuthContext()
async function login() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await fetch()
    if (puzzleDate.value && puzzleAttempt.value) {
      await $fetch('/api/account/progress', { method: 'POST', body: { puzzleDate: puzzleDate.value, attempt: puzzleAttempt.value } })
    }
    await navigateTo(useNuxtApp().$localePath({ name: returnToMaster.value ? 'master' : 'account' }))
  } catch (cause: any) {
    error.value = cause?.statusCode === 403 ? t('account.verifyFirst') : t('auth.loginError')
  } finally {
    busy.value = false
  }
}
</script>
