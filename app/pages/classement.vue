<template>
  <main class="page-wrap leaderboard-page">
    <NuxtLink class="soft-link back-link" :to="$localePath({ name: 'index' })">{{ t('leaderboard.back') }}</NuxtLink>
    <header class="leaderboard-intro">
      <p class="section-kicker">{{ t('leaderboard.kicker') }}</p>
      <h1>{{ t('leaderboard.title') }}</h1>
      <p>{{ t('leaderboard.description') }}</p>
      <p v-if="data?.puzzle" class="leaderboard-date">
        {{ formatPuzzleDate(data.puzzle.date, { dateStyle: 'full' }) }}
        <span aria-hidden="true">·</span>
        {{ t('home.pieces', { count: data.puzzle.gridSize ** 2 }) }}
      </p>
    </header>

    <section class="leaderboard-table" aria-labelledby="leaderboard-table-title">
      <h2 id="leaderboard-table-title" class="sr-only">{{ t('leaderboard.title') }}</h2>
      <div class="leaderboard-columns" aria-hidden="true">
        <span>{{ t('leaderboard.rank') }}</span>
        <span>{{ t('leaderboard.player') }}</span>
        <span>{{ t('leaderboard.score') }}</span>
      </div>
      <ol v-if="data?.entries.length" class="leaderboard-entries">
        <li v-for="entry in data.entries" :key="entry.ordinal" :class="{ 'is-leader': entry.rank === 1 }">
          <span class="leaderboard-rank"><span class="sr-only">{{ t('leaderboard.rank') }}: </span>{{ entry.rank }}</span>
          <span class="leaderboard-name"><span class="sr-only">{{ t('leaderboard.player') }}: </span>{{ entry.publicName }}</span>
          <strong class="leaderboard-score"><span class="sr-only">{{ t('leaderboard.score') }}: </span>{{ t(entry.moves === 1 ? 'game.movesOne' : 'game.movesMany', { count: entry.moves }) }}</strong>
        </li>
      </ol>
      <p v-else-if="data?.puzzle" class="leaderboard-empty">{{ t('leaderboard.empty') }}</p>
      <p v-else class="leaderboard-empty">{{ t('leaderboard.noPuzzle') }}</p>
    </section>

    <aside class="leaderboard-profile-note">
      <p>{{ t('leaderboard.profileNote') }}</p>
      <NuxtLink class="soft-link" :to="$localePath({ name: 'account' })">{{ t('leaderboard.manageProfile') }}</NuxtLink>
    </aside>
  </main>
</template>

<script setup lang="ts">
import { formatPuzzleDate as formatSharedPuzzleDate } from '#shared/types/puzzle'

interface LeaderboardPayload {
  puzzle: { date: string; title: string; titleEn: string; gridSize: number } | null
  entries: { rank: number; ordinal: number; publicName: string; moves: number }[]
}

definePageMeta({ name: 'leaderboard' })
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/leaderboard' } })
const { $getLocale, $localePath, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const { data } = await useFetch<LeaderboardPayload>('/api/leaderboard/today', { key: 'daily-leaderboard' })
const dateLocale = computed(() => $getLocale() === 'en' ? 'en-US' : 'fr-FR')
const formatPuzzleDate = (date: string, options?: Intl.DateTimeFormatOptions) => formatSharedPuzzleDate(date, options, dateLocale.value)
usePageSeo({ title: () => t('leaderboard.seoTitle'), description: () => t('leaderboard.description') })
defineOgImage('Puzzle.takumi', {
  title: computed(() => t('leaderboard.seoTitle')),
  image: `${String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')}/og-puzzle-zimablue.jpg`,
  imageAlt: 'Puzzle Zimablue daily leaderboard',
})
</script>
