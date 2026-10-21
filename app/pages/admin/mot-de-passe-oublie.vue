<template>
  <main class="auth-page">
    <section class="auth-sheet">
      <NuxtLink :to="$localePath({ name: 'admin-sign-in' })" class="auth-back">{{ t('auth.backToLogin') }}</NuxtLink>
      <p class="section-kicker">{{ t('auth.recovery') }}</p>
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
definePageMeta({ name: 'admin-forgot-password', layout: false })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/admin/forgot-password' } })
const email = ref('')
const sent = ref(false)
const error = ref('')
const busy = ref(false)
const { $getLocale, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
async function requestReset() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/forgot-password', { method: 'POST', body: { email: email.value, scope: 'admin', locale: $getLocale() } })
    sent.value = true
  } catch {
    error.value = t('auth.recoveryError')
  } finally {
    busy.value = false
  }
}
</script>
