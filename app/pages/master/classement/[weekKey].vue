<template>
  <main class="page-wrap master-leaderboard-page">
    <NuxtLink class="soft-link" :to="$localePath({ name: 'master' })">{{ t('master.back') }}</NuxtLink>
    <template v-if="data">
      <header class="master-leaderboard-heading">
        <p class="section-kicker">{{ t('master.kicker', { week: data.puzzle.weekKey }) }}</p>
        <h1>{{ t('master.leaderboardTitle') }}</h1>
        <p>{{ displayedTitle }} · {{ t('master.pieces', { count: data.puzzle.pieceCount }) }}</p>
      </header>
      <section class="master-score-summary" aria-label="{{ t('leaderboard.metricsTitle') }}">
        <div><strong>{{ data.metrics.participantCount }}</strong><span>{{ t('leaderboard.participants') }}</span></div>
        <div><strong>{{ data.metrics.bestMoves ?? '—' }}</strong><span>{{ t('leaderboard.score') }} · {{ t('master.best') }}</span></div>
        <div><strong>{{ data.metrics.medianMoves ?? '—' }}</strong><span>{{ t('leaderboard.median') }}</span></div>
      </section>
      <div v-if="data.entries.length" class="master-score-list" role="table" :aria-label="t('master.leaderboardTitle')">
        <div class="master-score-row master-score-header" role="row"><span role="columnheader">{{ t('leaderboard.rank') }}</span><span role="columnheader">{{ t('leaderboard.player') }}</span><span role="columnheader">{{ t('leaderboard.score') }}</span></div>
        <div v-for="entry in data.entries" :key="entry.ordinal" class="master-score-row" role="row">
          <span role="cell">{{ entry.rank }}</span>
          <NuxtLink v-if="entry.publicProfileToken" role="cell" :to="$localePath({ name: 'public-profile', params: { token: entry.publicProfileToken } })">{{ entry.publicName }}</NuxtLink>
          <span v-else role="cell">{{ entry.publicName }}</span>
          <strong role="cell">{{ entry.moves }}</strong>
        </div>
      </div>
      <p v-else class="empty-state">{{ t('master.leaderboardEmpty') }}</p>
    </template>
    <p v-else-if="pending" class="empty-state">{{ t('leaderboard.loading') }}</p>
    <p v-else class="empty-state" role="alert">{{ t('leaderboard.loadError') }}</p>
  </main>
</template>

<script setup lang="ts">
import type { MasterLeaderboardPayload } from '#shared/types/master'
definePageMeta({ name: 'master-leaderboard-weekKey', pageTransition: false })
const { $getLocale, $t, $localePath } = useI18n()
const { $defineI18nRoute } = useNuxtApp()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
await $defineI18nRoute({ localeRoutes: { en: '/master/leaderboard/[weekKey]' } })
const route = useRoute()
const weekKey = computed(() => String(route.params.weekKey))
const { data, error, pending } = await useFetch<MasterLeaderboardPayload>(`/api/master/${encodeURIComponent(weekKey.value)}/leaderboard`, { key: `master-leaderboard-${weekKey.value}` })
const displayedTitle = computed(() => $getLocale() === 'en' && data.value?.puzzle.titleEn ? data.value.puzzle.titleEn : data.value?.puzzle.title ?? '')
usePageSeo({ title: () => t('master.leaderboardTitle'), description: () => t('master.leaderboardDescription') })
if (error.value && !pending.value) setResponseStatus(404)
</script>

<style>
.master-leaderboard-page { flex: 1; padding-block: 2.4rem 5rem; }
.master-leaderboard-heading { margin-block: 2rem; }
.master-leaderboard-heading h1 { margin: .4rem 0; font-size: clamp(2rem, 6vw, 3.5rem); line-height: 1; font-weight: 850; }
.master-leaderboard-heading p:last-child { color: var(--muted); }
.master-score-summary { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: .8rem; margin-block: 1.5rem; }
.master-score-summary div { display: grid; gap: .3rem; padding: 1rem; border: 2px solid var(--ink); background: var(--yellow); }
.master-score-summary strong { font-size: 1.4rem; font-weight: 850; }
.master-score-summary span { color: var(--yellow-foreground); font-size: .72rem; font-weight: 750; }
.master-score-list { max-width: 52rem; border: 2px solid var(--ink); }
.master-score-row { display: grid; grid-template-columns: 4rem 1fr 5rem; align-items: center; gap: .7rem; min-height: 3.25rem; padding: .6rem .85rem; border-bottom: 1px solid color-mix(in srgb, var(--ink) 18%, transparent); }
.master-score-row:last-child { border-bottom: 0; }
.master-score-row > :last-child { justify-self: end; }
.master-score-row a { color: var(--blue); font-weight: 750; }
.master-score-header { min-height: 2.5rem; background: var(--ink); color: var(--white); font-size: .72rem; font-weight: 800; }
.master-score-header > :last-child { justify-self: end; }
@media (max-width: 480px) { .master-score-summary { gap: .45rem; } .master-score-summary div { padding: .65rem; } .master-score-row { grid-template-columns: 2.5rem 1fr 3.5rem; padding-inline: .55rem; } }
</style>
