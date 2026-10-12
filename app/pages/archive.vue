<template>
  <main class="page-wrap archive-page">
    <NuxtLink class="soft-link back-link" :to="$localePath({ name: 'index' })">{{ t('archive.back') }}</NuxtLink>
    <header class="archive-intro">
      <p class="section-kicker">{{ t('archive.kicker') }}</p>
      <h1>{{ t('archive.titleFirst') }}<br><em>{{ t('archive.titleSecond') }}</em></h1>
      <p>{{ t('archive.description') }}</p>
    </header>
    <div class="archive-list">
      <NuxtLink v-for="puzzle in archive" :key="puzzle.date" class="archive-card" :to="puzzlePath(puzzle.date)">
        <img :src="puzzle.imageUrl" :alt="t('home.illustrationAlt', { name: puzzle.imageName })" loading="lazy">
        <div class="archive-card-copy">
          <span>{{ formatPuzzleDate(puzzle.date, { day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
          <strong>{{ puzzleTitle(puzzle) }}</strong>
          <small>{{ t('archive.replay', { count: puzzle.gridSize ** 2 }) }}</small>
        </div>
        <span class="card-open" aria-hidden="true">↗</span>
      </NuxtLink>
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
const puzzleTitle = (puzzle: DailyPuzzle) => $getLocale() === 'en' && puzzle.titleEn ? puzzle.titleEn : puzzle.title
useSeoMeta({ title: () => t('archive.seoTitle'), description: () => t('archive.description') })
</script>