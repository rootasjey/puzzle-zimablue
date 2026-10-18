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

<style>
.leaderboard-metrics-note { max-width: 760px; margin: .6rem 0 2rem; color: var(--muted); font-size: .74rem; line-height: 1.5; }

.leaderboard-page { flex: 1; padding-top: clamp(2rem, 5vw, 3.7rem); padding-bottom: 5rem; }
.leaderboard-intro { max-width: 650px; margin-bottom: 2.5rem; }
.leaderboard-intro .section-kicker { margin-bottom: .45rem; }
.leaderboard-intro h1 { font-size: clamp(2.6rem, 5vw, 4.25rem); font-weight: 850; line-height: 1.04; }
.leaderboard-intro > p:not(.section-kicker):not(.leaderboard-date) { max-width: 48ch; margin: 1rem 0 0; color: var(--muted); line-height: 1.65; }
.leaderboard-date { display: flex; flex-wrap: wrap; align-items: center; gap: .55rem; margin: 1rem 0 0; color: var(--muted); font-size: .83rem; font-weight: 700; }
.leaderboard-metrics { display: grid; max-width: 760px; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .8rem 1.2rem; margin-bottom: .6rem; }
.leaderboard-metrics article { display: grid; align-content: start; gap: .3rem; padding-top: .65rem; border-top: 2px solid var(--ink); }
.leaderboard-metrics article strong { color: var(--blue); font-size: clamp(1.2rem, 2.5vw, 1.75rem); font-weight: 900; font-variant-numeric: tabular-nums; line-height: 1.1; }
.leaderboard-metrics article strong span { color: var(--muted); font-size: .8em; }
.leaderboard-metrics article > span { color: var(--muted); font-size: .7rem; font-weight: 700; line-height: 1.3; }
.leaderboard-table { max-width: 760px; border-top: 2px solid var(--ink); }
.leaderboard-columns, .leaderboard-entries li { display: grid; grid-template-columns: 4.2rem minmax(0, 1fr) auto; align-items: center; gap: 1rem; }
.leaderboard-columns { min-height: 2.9rem; color: var(--muted); font-size: .74rem; font-weight: 750; }
.leaderboard-columns span:last-child { text-align: right; }
.leaderboard-entries { margin: 0; padding: 0; border-bottom: 2px solid var(--ink); list-style: none; }
.leaderboard-entries li { min-height: 4.1rem; border-top: 1px solid var(--line-divider); font-size: .92rem; }
.leaderboard-entries li.is-leader { margin-inline: -.6rem; padding-inline: .6rem; border-inline: 2px solid var(--ink); background: var(--yellow); color: var(--yellow-foreground); }
.leaderboard-rank { color: var(--blue); font-size: 1.1rem; font-weight: 900; font-variant-numeric: tabular-nums; }
.leaderboard-name { overflow-wrap: anywhere; font-weight: 750; }
.leaderboard-profile-link { color: inherit; text-decoration-thickness: 1px; text-underline-offset: .2rem; }
.leaderboard-profile-link:hover { color: var(--blue); }
.leaderboard-entries li.is-leader .leaderboard-profile-link:hover { color: var(--yellow-foreground); }
.leaderboard-score { color: var(--blue); font-size: .84rem; font-weight: 850; text-align: right; white-space: nowrap; }
.leaderboard-entries li.is-leader .leaderboard-score, .leaderboard-entries li.is-leader .leaderboard-rank { color: var(--yellow-foreground); }
.leaderboard-profile-note { display: flex; max-width: 760px; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 2rem; padding: .35rem 0 .35rem 1rem; border-left: 4px solid var(--yellow); }
.leaderboard-profile-note p { max-width: 50ch; margin: 0; color: var(--muted); font-size: .86rem; line-height: 1.6; }
.leaderboard-profile-note .soft-link { color: var(--blue); font-size: .82rem; white-space: nowrap; }
@media (max-width: 600px) {
  .leaderboard-profile-note { align-items: flex-start; flex-direction: column; }
  .leaderboard-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .85rem 1rem; }
  .leaderboard-metrics article strong { font-size: 1.35rem; } }
</style>
