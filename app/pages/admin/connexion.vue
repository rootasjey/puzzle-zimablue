<template>
  <main class="auth-page">
    <section class="auth-sheet">
      <NuxtLink :to="$localePath({ name: 'index' })" class="auth-back">{{ t('auth.back') }}</NuxtLink>
      <p class="section-kicker">{{ t('auth.private') }}</p>
      <h1>{{ t('auth.loginTitle') }}</h1>
      <p class="auth-intro">{{ t('auth.loginDescription') }}</p>
      <form class="auth-form" @submit.prevent="login">
        <label>{{ t('auth.email') }}<input v-model="email" type="email" autocomplete="username" required></label>
        <label>{{ t('auth.password') }}<input v-model="password" type="password" autocomplete="current-password" required></label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="admin-primary" :disabled="busy">{{ busy ? t('auth.loggingIn') : t('auth.login') }}</button>
      </form>
      <NuxtLink class="auth-small-link" :to="$localePath({ name: 'admin-forgot-password' })">{{ t('auth.forgot') }}</NuxtLink>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ name: 'admin-sign-in', layout: false })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/admin/sign-in' } })
const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)
const { fetch } = useUserSession()
const { $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')

async function login() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await fetch()
    await navigateTo(useNuxtApp().$localePath({ name: 'admin-calendar' }))
  } catch (cause: any) {
    error.value = t('auth.loginError')
  } finally {
    busy.value = false
  }
}
</script>