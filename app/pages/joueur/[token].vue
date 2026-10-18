<template>
  <main class="page-wrap public-player-page">
    <NuxtLink class="soft-link back-link" :to="$localePath({ name: 'leaderboard' })">{{ t('publicProfile.back') }}</NuxtLink>
    <div v-if="pending" class="calendar-loading"><BrandLoader :label="t('publicProfile.loading')" /></div>
    <p v-else-if="error" class="leaderboard-empty" role="alert">{{ t('publicProfile.loadError') }}</p>
    <template v-else-if="data">
      <header class="leaderboard-intro public-player-intro">
        <p class="section-kicker">{{ t('publicProfile.kicker') }}</p>
        <h1>{{ data.profile.publicName }}</h1>
        <p>{{ t('publicProfile.description') }}</p>
      </header>

      <section class="public-player-summary" :aria-label="t('publicProfile.summary')">
        <strong>{{ data.stats.completedCount }}</strong>
        <span>{{ t('publicProfile.completed') }}</span>
      </section>

      <section class="public-player-stats" aria-labelledby="public-player-stats-title">
        <h2 id="public-player-stats-title">{{ t('publicProfile.byDifficulty') }}</h2>
        <div v-if="data.stats.difficulties.length" class="metrics-table-wrap">
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
              <tr v-for="difficulty in data.stats.difficulties" :key="`${difficulty.gridRows}x${difficulty.gridColumns}`">
                <th scope="row">{{ t('home.pieces', { count: difficulty.pieceCount }) }}</th>
                <td>{{ difficulty.completions }}</td>
                <td>{{ formatNumber(difficulty.averageMoves) }}</td>
                <td>{{ difficulty.bestMoves }}</td>
                <td>{{ difficulty.worstMoves }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="leaderboard-empty">{{ t('publicProfile.noScores') }}</p>
      </section>
      <p class="public-player-note">{{ t('publicProfile.verifiedOnly') }}</p>
    </template>
  </main>
</template>

<script setup lang="ts">
interface PublicPlayerPayload {
  profile: { publicName: string }
  stats: {
    completedCount: number
    difficulties: { gridRows: number; gridColumns: number; pieceCount: number; completions: number; averageMoves: number; bestMoves: number; worstMoves: number }[]
  }
}

definePageMeta({ name: 'public-player-profile' })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/player/[token]' } })
const route = useRoute()
const { $getLocale, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const locale = computed(() => $getLocale() === 'en' ? 'en-US' : 'fr-FR')
const token = computed(() => String(route.params.token))
const profileUrl = computed(() => `/api/public-profiles/${encodeURIComponent(token.value)}`)
const { data, error, pending } = await useFetch<PublicPlayerPayload>(profileUrl, { key: computed(() => `public-player-${token.value}`) })
if (error.value?.statusCode === 404) throw createError({ statusCode: 404, statusMessage: t('publicProfile.notFound') })
const formatNumber = (value: number) => new Intl.NumberFormat(locale.value, { maximumFractionDigits: 1 }).format(value)
usePageSeo({
  title: () => data.value ? t('publicProfile.seoTitle', { name: data.value.profile.publicName }) : t('publicProfile.title'),
  description: () => t('publicProfile.description'),
})
</script>

<style>
.public-player-summary { display: flex; max-width: 760px; align-items: baseline; gap: .7rem; margin: 0 0 2.5rem; padding: 1rem 0; border-block: 2px solid var(--ink); }
.public-player-summary strong { color: var(--blue); font-size: 2.2rem; font-weight: 900; line-height: 1; }
.public-player-summary span { color: var(--muted); font-size: .86rem; font-weight: 700; }
.public-player-page { flex: 1; padding-top: clamp(2rem, 5vw, 3.7rem); padding-bottom: 5rem; }
.public-player-stats { max-width: 760px; }
.public-player-stats h2 { margin: 0 0 .9rem; font-size: 1.3rem; font-weight: 850; }
.public-player-stats .metrics-table-wrap { overflow-x: auto; }
.public-player-table { min-width: 530px; }
.public-player-table thead th:first-child { width: 28%; }
.public-player-table thead th:nth-child(2), .public-player-table thead th:nth-child(3) { width: 15%; }
.public-player-table thead th:nth-child(4), .public-player-table thead th:nth-child(5) { width: 21%; }
.public-player-note { max-width: 760px; margin: 1.1rem 0 0; color: var(--muted); font-size: .75rem; line-height: 1.5; }
</style>
