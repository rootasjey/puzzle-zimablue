<template>
  <main class="auth-page">
    <section class="auth-sheet account-auth-sheet auth-account-recovery">
      <NuxtLink :to="$localePath({ name: 'account-sign-in', query: accountQuery })" class="auth-back">{{ t('auth.backToLogin') }}</NuxtLink>
      <h1>{{ t('auth.forgotTitle') }}</h1>
      <p class="auth-intro">{{ t('auth.recoveryDescription') }}</p>
      <form v-if="!sent" class="auth-form" @submit.prevent="requestReset">
        <label>{{ t('auth.email') }}<input v-model="email" type="email" autocomplete="email" required></label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="admin-primary" :disabled="busy">{{ busy ? t('auth.sending') : t('auth.sendLink') }}</button>
      </form>
      <p v-else class="auth-confirmation" role="status">{{ t('auth.recoverySent') }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ name: 'account-forgot-password', layout: false })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/account/forgot-password' } })
const { $getLocale, $t } = useI18n()
const { accountQuery } = useAccountAuthContext()
const email = ref('')
const sent = ref(false)
const error = ref('')
const busy = ref(false)
const t = (key: string): string => String($t(key as any) ?? '')

async function requestReset() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value, scope: 'account', locale: $getLocale() },
    })
    sent.value = true
  } catch {
    error.value = t('auth.recoveryError')
  } finally {
    busy.value = false
  }
}
</script>
