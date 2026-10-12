<template>
  <main class="auth-page">
    <section class="auth-sheet">
      <p class="section-kicker">{{ t('account.kicker') }}</p>
      <h1>{{ t('account.verifyTitle') }}</h1>
      <p v-if="busy" class="auth-intro" role="status">{{ t('account.verifying') }}</p>
      <p v-else-if="error" class="form-error" role="alert">{{ error }}</p>
      <p v-else class="auth-confirmation" role="status">{{ t('account.verified') }}</p>
      <NuxtLink v-if="!busy" class="auth-small-link" :to="$localePath({ name: 'account' })">{{ t('account.goToStats') }}</NuxtLink>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ name: 'account-verify', layout: false })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/account/verify' } })
const route = useRoute()
const { fetch } = useUserSession()
const { $t } = useI18n()
const t = (key: string): string => String($t(key as any) ?? '')
const busy = ref(true)
const error = ref('')
onMounted(async () => {
  try {
    if (typeof route.query.token !== 'string') throw new Error()
    await $fetch('/api/auth/verify-email', { method: 'POST', body: { token: route.query.token } })
    await fetch()
  } catch {
    error.value = t('account.verifyError')
  } finally {
    busy.value = false
  }
})
</script>
