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
