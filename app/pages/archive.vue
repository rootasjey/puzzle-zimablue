<template>
  <main class="page-wrap archive-page">
    <NuxtLink class="soft-link back-link" :to="$localePath({ name: 'index' })">{{ t('archive.back') }}</NuxtLink>
    <header class="archive-intro">
      <p class="section-kicker">{{ t('archive.kicker') }}</p>
      <h1>{{ t('archive.titleFirst') }}<br><em>{{ t('archive.titleSecond') }}</em></h1>
      <p>{{ t('archive.description') }}</p>
    </header>
    <div class="archive-list">
      <article v-for="puzzle in archive" :key="puzzle.date" class="archive-history-item">
        <NuxtLink class="archive-card" :to="puzzlePath(puzzle.date)">
          <img :src="puzzle.imageUrl" :alt="t('home.illustrationAlt', { name: puzzle.imageName })" loading="lazy">
          <div class="archive-card-copy">
            <span>{{ formatPuzzleDate(puzzle.date, { day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
            <strong>{{ puzzleTitle(puzzle) }}</strong>
            <small>{{ t('archive.replay', { count: puzzle.pieceCount }) }}</small>
          </div>
          <span class="card-open" aria-hidden="true">↗</span>
        </NuxtLink>
        <NuxtLink class="archive-history-board-link" :to="leaderboardPath(puzzle.date)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5v2a3 3 0 0 0 3 3m8-5h3v2a3 3 0 0 1-3 3m-4 1v4m-4 3h8m-7 0v-3h6v3" /></svg>
          {{ t('archive.leaderboard') }}<span aria-hidden="true">↗</span>
        </NuxtLink>
      </article>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { DailyPuzzle } from '#shared/types/puzzle'
import { formatPuzzleDate as formatSharedPuzzleDate } from '#shared/types/puzzle'
definePageMeta({ name: 'archive' })
const { $getLocale, $localePath, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')

const { data: puzzles } = await useFetch<DailyPuzzle[]>('/api/puzzles', { key: 'published-puzzles-archive' })
const parisToday = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date())
const archive = computed(() => puzzles.value?.filter(puzzle => puzzle.date < parisToday) ?? [])
const language = computed(() => $getLocale() === 'en' ? 'en-US' : 'fr-FR')
const formatPuzzleDate = (date: string, options?: Intl.DateTimeFormatOptions) => formatSharedPuzzleDate(date, options, language.value)
const puzzlePath = (date: string) => $localePath({ name: 'play', params: { date } })
const leaderboardPath = (date: string) => $localePath({ name: 'leaderboard-puzzle', params: { date } })
const puzzleTitle = (puzzle: DailyPuzzle) => $getLocale() === 'en' && puzzle.titleEn ? puzzle.titleEn : puzzle.title
usePageSeo({ title: () => t('archive.seoTitle'), description: () => t('archive.description') })
defineOgImage('Puzzle.takumi', {
  title: computed(() => t('archive.seoTitle')),
  image: `${String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')}/og-puzzle-zimablue.jpg`,
  imageAlt: 'Pièces de puzzle colorées sur fond bleu et crème',
})
</script>
