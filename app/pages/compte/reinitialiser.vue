<template>
  <main class="auth-page">
    <section class="auth-sheet account-auth-sheet auth-account-reset">
      <NuxtLink :to="$localePath({ name: 'account-sign-in' })" class="auth-back">{{ t('auth.backToLogin') }}</NuxtLink>
      <p class="section-kicker">{{ t('auth.security') }}</p>
      <h1>{{ t('auth.newPassword') }}</h1>
      <form v-if="!done" class="auth-form" @submit.prevent="resetPassword">
        <label>{{ t('auth.newPassword') }}<input v-model="password" type="password" autocomplete="new-password" minlength="12" required><small class="auth-field-help">{{ t('auth.passwordMinimum') }}</small></label>
        <label>{{ t('auth.confirmPassword') }}<input v-model="confirmation" type="password" autocomplete="new-password" minlength="12" required></label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="admin-primary" :disabled="busy">{{ busy ? t('auth.savingPassword') : t('auth.savePassword') }}</button>
      </form>
      <p v-else class="auth-confirmation" role="status">{{ t('auth.passwordChanged') }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ name: 'account-reset-password', layout: false })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/account/reset-password' } })
const route = useRoute()
const { $t } = useI18n()
const password = ref('')
const confirmation = ref('')
const error = ref('')
const done = ref(false)
const busy = ref(false)
const t = (key: string): string => String($t(key as any) ?? '')

async function resetPassword() {
  if (password.value !== confirmation.value) { error.value = t('auth.passwordMismatch'); return }
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/reset-password', { method: 'POST', body: { token: route.query.token, password: password.value } })
    done.value = true
  } catch {
    error.value = t('auth.resetError')
  } finally {
    busy.value = false
  }
}
</script>
