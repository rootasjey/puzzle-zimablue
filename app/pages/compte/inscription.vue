<template>
  <main class="auth-page">
    <section class="auth-sheet">
      <NuxtLink :to="$localePath({ name: 'account' })" class="auth-back">{{ t('auth.back') }}</NuxtLink>
      <p class="section-kicker">{{ t('account.kicker') }}</p>
      <h1>{{ t('account.createAccount') }}</h1>
      <p class="auth-intro">{{ t('account.registrationDescription') }}</p>
      <p v-if="puzzleDate" class="auth-confirmation account-puzzle-claim">{{ t('account.claimedPuzzle', { date: formatPuzzleDate(puzzleDate, { dateStyle: 'medium' }, dateLocale) }) }}</p>
      <form v-if="!sent" class="auth-form" @submit.prevent="register">
        <label>{{ t('auth.email') }}<input v-model="email" type="email" autocomplete="email" required></label>
        <label>{{ t('auth.password') }}<input v-model="password" type="password" autocomplete="new-password" minlength="12" required></label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="admin-primary" :disabled="busy">{{ busy ? t('auth.creating') : t('account.createAccount') }}</button>
      </form>
      <p v-else class="auth-confirmation" role="status">{{ t('account.verificationSent') }}</p>
      <p class="account-secondary-link">{{ t('account.alreadyHaveAccount') }} <NuxtLink :to="$localePath({ name: 'account-sign-in' })">{{ t('auth.login') }}</NuxtLink></p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { formatPuzzleDate } from '#shared/types/puzzle'
import { MAX_ATTEMPT_LENGTH } from '#shared/utils/puzzle-attempt'
definePageMeta({ name: 'account-sign-up', layout: false })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/account/sign-up' } })
const route = useRoute()
const { $getLocale, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const dateLocale = computed(() => $getLocale() === 'en' ? 'en-US' : 'fr-FR')
const puzzleDate = computed(() => typeof route.query.puzzleDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(route.query.puzzleDate) ? route.query.puzzleDate : '')
const puzzleAttempt = computed(() => typeof route.query.attempt === 'string' && route.query.attempt.length <= MAX_ATTEMPT_LENGTH ? route.query.attempt : '')
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
