<template>
  <main class="account-page">
    <section v-if="loggedIn" class="account-content">
      <NuxtLink :to="$localePath({ name: 'index' })" class="auth-back">{{ t('auth.back') }}</NuxtLink>
      <p class="section-kicker">{{ t('account.kicker') }}</p>
      <div class="account-heading">
        <div>
          <h1>{{ t('account.title') }}</h1>
          <p class="auth-intro">{{ user?.email }}</p>
        </div>
        <button class="admin-secondary" type="button" :disabled="busy" @click="logout">{{ t('account.signOut') }}</button>
      </div>
      <p v-if="route.query.verified === '1'" class="auth-confirmation" role="status">{{ t('account.verified') }}</p>
      <p v-if="error" class="form-error" role="alert">{{ t('account.loadError') }}</p>
      <div v-else-if="stats" class="account-stats">
        <article class="account-stat"><strong>{{ stats.completedCount }}</strong><span>{{ t('account.puzzlesCompleted') }}</span></article>
        <article class="account-stat"><strong>{{ stats.currentStreak }}</strong><span>{{ t('account.dayStreak') }}</span></article>
        <article class="account-stat"><strong>{{ stats.bestMoves ?? '—' }}</strong><span>{{ t('account.bestMoves') }}</span></article>
      </div>
      <section class="account-history">
        <h2>{{ t('account.history') }}</h2>
        <p v-if="stats?.completions.length === 0" class="auth-intro">{{ t('account.empty') }}</p>
        <ul v-else-if="stats" class="account-completions">
          <li v-for="completion in stats.completions" :key="completion.puzzleDate">
            <NuxtLink :to="$localePath({ name: 'play', params: { date: completion.puzzleDate } })">
              <span>{{ formatPuzzleDate(completion.puzzleDate, { dateStyle: 'medium' }, dateLocale) }}</span>
              <strong>{{ t(completion.moves === 1 ? 'game.movesOne' : 'game.movesMany', { count: completion.moves }) }}</strong>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </section>
    <section v-else class="auth-sheet account-welcome">
      <NuxtLink :to="$localePath({ name: 'index' })" class="auth-back">{{ t('auth.back') }}</NuxtLink>
      <p class="section-kicker">{{ t('account.kicker') }}</p>
      <h1>{{ t('account.title') }}</h1>
      <p class="auth-intro">{{ t('account.description') }}</p>
      <div class="account-actions">
        <NuxtLink class="admin-primary" :to="$localePath({ name: 'account-sign-in' })">{{ t('auth.login') }}</NuxtLink>
        <NuxtLink class="admin-secondary" :to="$localePath({ name: 'account-sign-up' })">{{ t('account.createAccount') }}</NuxtLink>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { formatPuzzleDate } from '#shared/types/puzzle'
interface AccountStats { completedCount: number; currentStreak: number; bestMoves: number | null; completions: { puzzleDate: string; moves: number; completedAt: string }[] }
definePageMeta({ name: 'account' })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/account' } })
const route = useRoute()
const { loggedIn, user, fetch } = useUserSession()
const { $getLocale, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const dateLocale = computed(() => $getLocale() === 'en' ? 'en-US' : 'fr-FR')
const { data: stats, error } = await useFetch<AccountStats>('/api/account/stats', { immediate: loggedIn.value })
const busy = ref(false)
async function logout() {
  busy.value = true
  await $fetch('/api/auth/logout', { method: 'POST' })
  await fetch()
  await navigateTo(useNuxtApp().$localePath({ name: 'account-sign-in' }))
}
</script>
