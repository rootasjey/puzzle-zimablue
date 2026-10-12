<template>
  <main class="auth-page">
    <section class="auth-sheet">
      <NuxtLink :to="$localePath({ name: 'index' })" class="auth-back">{{ t('auth.back') }}</NuxtLink>
      <p class="section-kicker">{{ t('auth.firstSetup') }}</p>
      <h1>{{ t('auth.createAdmin') }}</h1>
      <p v-if="!available" class="auth-intro">{{ t('auth.setupUnavailable') }}</p>
      <template v-else>
        <p class="auth-intro">{{ t('auth.setupDescription') }}</p>
        <form class="auth-form" @submit.prevent="setup">
          <label>{{ t('auth.ownerEmail') }}<input v-model="email" type="email" autocomplete="username" required></label>
          <label>{{ t('auth.setupKey') }}<input v-model="setupKey" type="password" autocomplete="off" required></label>
          <label>{{ t('auth.password') }}<input v-model="password" type="password" autocomplete="new-password" minlength="12" required></label>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <button class="admin-primary" :disabled="busy">{{ busy ? t('auth.creating') : t('auth.createAccount') }}</button>
        </form>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ name: 'admin-setup', layout: false })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/admin/setup' } })
const email = ref('')
const setupKey = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)
const { data } = await useFetch<{ available: boolean }>('/api/auth/setup-status')
const available = computed(() => data.value?.available === true)
const { $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')

async function setup() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/setup', { method: 'POST', body: { email: email.value, setupKey: setupKey.value, password: password.value } })
    await navigateTo(useNuxtApp().$localePath({ name: 'admin-calendar' }))
  } catch (cause: any) {
    error.value = t('auth.setupError')
  } finally {
    busy.value = false
  }
}
</script>