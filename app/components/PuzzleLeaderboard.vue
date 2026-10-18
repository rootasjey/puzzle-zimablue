<template>
  <main class="page-wrap leaderboard-page">
    <NuxtLink class="soft-link back-link" :to="backLink">{{ t(data?.scope === 'historical' ? 'leaderboard.backToArchive' : 'leaderboard.back') }}</NuxtLink>
    <header class="leaderboard-intro">
      <p class="section-kicker">{{ t(data?.scope === 'historical' ? 'leaderboard.historyKicker' : 'leaderboard.kicker') }}</p>
      <h1>{{ t(data?.scope === 'historical' ? 'leaderboard.historyTitle' : 'leaderboard.title') }}</h1>
      <p>{{ t(data?.scope === 'historical' ? 'leaderboard.historyDescription' : 'leaderboard.description') }}</p>
      <p v-if="data?.puzzle" class="leaderboard-date">
        {{ formatPuzzleDate(data.puzzle.date, { dateStyle: 'full' }) }}
        <span aria-hidden="true">·</span>
        {{ t('home.pieces', { count: data.puzzle.pieceCount }) }}
      </p>
    </header>

    <div v-if="pending" class="calendar-loading"><BrandLoader :label="t('leaderboard.loading')" /></div>
    <p v-else-if="error" class="leaderboard-empty" role="alert">{{ t('leaderboard.loadError') }}</p>
    <template v-else-if="data?.puzzle && data.metrics">
      <section class="leaderboard-metrics" :aria-label="t('leaderboard.metricsTitle')">
        <article>
          <strong>{{ data.metrics.participantCount }}</strong>
          <span>{{ t('leaderboard.participants') }}</span>
        </article>
        <article>
          <strong>{{ formatNumber(data.metrics.averageMoves) }}</strong>
          <span>{{ t('leaderboard.average') }}</span>
        </article>
        <article>
          <strong>{{ formatNumber(data.metrics.medianMoves) }}</strong>
          <span>{{ t('leaderboard.median') }}</span>
        </article>
        <article>
          <strong>{{ formatNumber(data.metrics.bestMoves) }} <span aria-hidden="true">/</span> {{ formatNumber(data.metrics.worstMoves) }}</strong>
          <span>{{ t('leaderboard.bestWorst') }}</span>
        </article>
      </section>
      <p class="leaderboard-metrics-note">{{ t(data.scope === 'historical' ? 'leaderboard.historyMetricsNote' : 'leaderboard.metricsNote') }}</p>

      <section class="leaderboard-table" aria-labelledby="leaderboard-table-title">
        <h2 id="leaderboard-table-title" class="sr-only">{{ t(data.scope === 'historical' ? 'leaderboard.historyTitle' : 'leaderboard.title') }}</h2>
        <div class="leaderboard-columns" aria-hidden="true">
          <span>{{ t('leaderboard.rank') }}</span>
          <span>{{ t('leaderboard.player') }}</span>
          <span>{{ t('leaderboard.score') }}</span>
        </div>
        <ol v-if="data.entries.length" class="leaderboard-entries">
          <li v-for="entry in data.entries" :key="entry.ordinal" :class="{ 'is-leader': entry.rank === 1 }">
            <span class="leaderboard-rank"><span class="sr-only">{{ t('leaderboard.rank') }}: </span>{{ entry.rank }}</span>
            <NuxtLink
              v-if="entry.publicProfileToken"
              class="leaderboard-name leaderboard-profile-link"
              :to="$localePath({ name: 'public-player-profile', params: { token: entry.publicProfileToken } })"
            >
              {{ entry.publicName }}<span class="sr-only"> — {{ t('leaderboard.openProfile') }}</span>
            </NuxtLink>
            <span v-else class="leaderboard-name">{{ entry.publicName }}</span>
            <strong class="leaderboard-score"><span class="sr-only">{{ t('leaderboard.score') }}: </span>{{ t(entry.moves === 1 ? 'game.movesOne' : 'game.movesMany', { count: entry.moves }) }}</strong>
          </li>
        </ol>
        <p v-else class="leaderboard-empty">{{ t(data.scope === 'historical' ? 'leaderboard.historyEmpty' : 'leaderboard.empty') }}</p>
      </section>
    </template>
    <p v-else class="leaderboard-empty">{{ t('leaderboard.noPuzzle') }}</p>

    <aside class="leaderboard-profile-note">
      <p>{{ t('leaderboard.profileNote') }}</p>
      <NuxtLink class="soft-link" :to="$localePath({ name: 'account' })">{{ t('leaderboard.manageProfile') }}</NuxtLink>
    </aside>
  </main>
</template>

<script setup lang="ts">
import type { LeaderboardPayload } from '#shared/types/leaderboard'
import { formatPuzzleDate as formatSharedPuzzleDate } from '#shared/types/puzzle'

const props = withDefaults(defineProps<{
  date: string
  historical?: boolean
  data?: LeaderboardPayload | null
  error?: unknown
  pending?: boolean
}>(), { historical: false, pending: false })
const { $getLocale, $localePath, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const dateLocale = computed(() => $getLocale() === 'en' ? 'en-US' : 'fr-FR')
const backLink = computed(() => $localePath({ name: props.data?.scope === 'historical' ? 'archive' : 'index' }))
const formatPuzzleDate = (date: string, options?: Intl.DateTimeFormatOptions) => formatSharedPuzzleDate(date, options, dateLocale.value)
const formatNumber = (value: number | null) => value === null ? '—' : new Intl.NumberFormat(dateLocale.value, { maximumFractionDigits: 1 }).format(value)
usePageSeo({
  title: () => t(props.data?.scope === 'historical' ? 'leaderboard.historySeoTitle' : 'leaderboard.seoTitle'),
  description: () => t(props.data?.scope === 'historical' ? 'leaderboard.historyDescription' : 'leaderboard.description'),
})
defineOgImage('Puzzle.takumi', {
  title: computed(() => t(props.data?.scope === 'historical' ? 'leaderboard.historySeoTitle' : 'leaderboard.seoTitle')),
  image: `${String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')}/og-puzzle-zimablue.jpg`,
  imageAlt: 'Puzzle Zimablue leaderboard',
})
</script>
