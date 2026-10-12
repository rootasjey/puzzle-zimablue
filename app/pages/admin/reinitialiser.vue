<template>
  <main class="auth-page">
    <section class="auth-sheet">
      <NuxtLink :to="$localePath({ name: 'admin-sign-in' })" class="auth-back">{{ t('auth.backToLogin') }}</NuxtLink>
      <p class="section-kicker">{{ t('auth.security') }}</p>
      <h1>{{ t('auth.newPassword') }}</h1>
      <form class="auth-form" @submit.prevent="resetPassword">
        <label>{{ t('auth.newPassword') }}<input v-model="password" type="password" autocomplete="new-password" minlength="12" required></label>
        <label>{{ t('auth.confirmPassword') }}<input v-model="confirmation" type="password" autocomplete="new-password" minlength="12" required></label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <p v-if="done" class="auth-confirmation" role="status">{{ t('auth.passwordChanged') }}</p>
        <button class="admin-primary" :disabled="busy || done">{{ busy ? t('auth.savingPassword') : t('auth.savePassword') }}</button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ name: 'admin-reset-password', layout: false })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/admin/reset-password' } })
const route = useRoute()
const password = ref('')
const confirmation = ref('')
const error = ref('')
const done = ref(false)
const busy = ref(false)
const { $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
async function resetPassword() {
  if (password.value !== confirmation.value) { error.value = t('auth.passwordMismatch'); return }
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/reset-password', { method: 'POST', body: { token: route.query.token, password: password.value } })
    done.value = true
  } catch (cause: any) {
    error.value = t('auth.resetError')
  } finally {
    busy.value = false
  }
}
</script>