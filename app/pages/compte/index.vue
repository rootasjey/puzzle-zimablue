<template>
  <main class="account-page">
    <section v-if="loggedIn" class="account-content">
      <div class="account-heading">
        <div>
          <img v-if="preferences.avatarUrl()" class="account-avatar" :src="preferences.avatarUrl( preferences.preferences.value.avatarVariant, 128)" alt="">
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
      <section v-if="stats" class="account-cumulative-stats" aria-labelledby="account-cumulative-stats-title">
        <h2 id="account-cumulative-stats-title">{{ t('account.cumulativeStats') }}</h2>
        <p>{{ t('account.verifiedStatsNote') }}</p>
        <div v-if="stats.verifiedStats.difficulties.length" class="metrics-table-wrap">
          <table class="metrics-table public-player-table">
            <thead>
              <tr>
                <th scope="col">{{ t('publicProfile.difficulty') }}</th>
                <th scope="col">{{ t('publicProfile.games') }}</th>
                <th scope="col">{{ t('publicProfile.average') }}</th>
                <th scope="col">{{ t('publicProfile.best') }}</th>
                <th scope="col">{{ t('publicProfile.highest') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="difficulty in stats.verifiedStats.difficulties" :key="`${difficulty.gridRows}x${difficulty.gridColumns}`">
                <th scope="row">{{ t('home.pieces', { count: difficulty.pieceCount }) }}</th>
                <td>{{ difficulty.completions }}</td>
                <td>{{ formatNumber(difficulty.averageMoves) }}</td>
                <td>{{ difficulty.bestMoves }}</td>
                <td>{{ difficulty.worstMoves }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="metrics-empty">{{ t('publicProfile.noScores') }}</p>
      </section>
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
interface AccountStats { completedCount: number; currentStreak: number; bestMoves: number | null; verifiedStats: { completedCount: number; difficulties: { gridRows: number; gridColumns: number; pieceCount: number; completions: number; averageMoves: number; bestMoves: number; worstMoves: number }[] }; completions: { puzzleDate: string; moves: number; completedAt: string }[] }
definePageMeta({ name: 'account' })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/account' } })
const route = useRoute()
const { loggedIn, user, fetch } = useUserSession()
const preferences = useAccountPreferences()
const { $localePath } = useNuxtApp()
const { $getLocale, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const dateLocale = computed(() => $getLocale() === 'en' ? 'en-US' : 'fr-FR')
const formatNumber = (value: number) => new Intl.NumberFormat(dateLocale.value, { maximumFractionDigits: 1 }).format(value)
const { data: stats, error } = await useFetch<AccountStats>('/api/account/stats', { immediate: loggedIn.value })
const busy = ref(false)
async function logout() {
  busy.value = true
  await $fetch('/api/auth/logout', { method: 'POST' })
  await fetch()
  await navigateTo(useNuxtApp().$localePath({ name: 'account-sign-in' }))
}
</script>

<style>
.account-avatar { width: 4.5rem; height: 4.5rem; margin-bottom: .5rem; border: 2px solid var(--ink); border-radius: 50%; object-fit: cover; }
.account-heading { display: flex; align-items: start; justify-content: space-between; gap: 1.25rem; margin-bottom: 1.4rem; }
.account-heading h1 { font-size: clamp(2rem, 6vw, 3rem); font-weight: 850; }
.account-heading .auth-intro { margin-bottom: 0; }
.account-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 2rem 0 2.6rem; border: 2px solid var(--ink); background: var(--white); box-shadow: var(--shadow); }
.account-stat { display: grid; min-height: 110px; align-content: center; justify-items: center; gap: .35rem; padding: .7rem; text-align: center; }
.account-stat + .account-stat { border-left: 2px solid var(--ink); }
.account-stat strong { color: var(--blue); font-size: clamp(1.6rem, 4vw, 2.3rem); font-weight: 900; line-height: 1; }
.account-stat span { max-width: 16ch; color: var(--muted); font-size: .76rem; font-weight: 700; line-height: 1.35; }
.account-cumulative-stats { margin: 0 0 2.4rem; }
.account-cumulative-stats h2 { margin: 0 0 .45rem; font-size: 1.25rem; font-weight: 850; }
.account-cumulative-stats > p { margin: 0 0 .8rem; color: var(--muted); font-size: .82rem; line-height: 1.5; }
.account-history h2 { margin: 0 0 .8rem; font-size: 1.4rem; font-weight: 850; }
.account-public-profile { margin: 0 0 2.4rem; padding: 1.2rem 0; border-block: 1px solid var(--line-divider); }
.account-public-profile h2 { margin: 0; font-size: 1.2rem; font-weight: 850; }
.account-public-profile > p { max-width: 58ch; margin: .45rem 0 1rem; color: var(--muted); font-size: .86rem; line-height: 1.6; }
.account-public-sharing { margin-top: -1.4rem; }
.account-completions { margin: 0; padding: 0; border-top: 2px solid var(--ink); list-style: none; }
.account-completions li { border-bottom: 1px solid var(--line-divider); }
.account-completions a { display: flex; min-height: 3.25rem; align-items: center; justify-content: space-between; gap: 1rem; padding: .5rem .15rem; color: var(--ink); font-size: .86rem; text-decoration: none; }
.account-completions a:hover { color: var(--blue); }
.account-completions strong { color: var(--blue); font-size: .8rem; }
.account-cumulative-stats .metrics-table-wrap { overflow-x: auto; }
@media (max-width: 600px) {
  .account-heading { align-items: flex-start; flex-direction: column; } }
</style>
