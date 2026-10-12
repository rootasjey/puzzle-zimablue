<template>
  <main class="page-wrap home-page">
    <section v-if="featured" class="daily-feature">
      <div class="feature-art">
        <img :src="featured.imageUrl" :alt="t('home.illustrationAlt', { name: featured.imageName })" fetchpriority="high">
        <span class="art-index">{{ formatPuzzleDate(featured.date, { day: 'numeric', month: 'numeric' }) }}</span>
      </div>
      <div class="feature-copy">
        <p class="section-kicker">{{ t('home.kicker') }}</p>
        <h1>{{ t('home.titleFirst') }}<br>{{ t('home.titleJoin') }} <em>{{ t('home.titleColor') }}</em></h1>
        <p class="feature-description">{{ t('home.description') }}</p>
        <div class="today-line">{{ formatPuzzleDate(featured.date) }} <span class="line-divider">·</span> {{ t('home.pieces', { count: featured.gridSize ** 2 }) }}</div>
        <NuxtLink class="play-link" :to="puzzlePath(featured.date)">{{ t('home.playToday') }} <span aria-hidden="true">↗</span></NuxtLink>
      </div>
    </section>
    <p v-else class="empty-state">{{ t('home.empty') }}</p>

    <section class="archive-preview" aria-labelledby="archive-title">
      <div class="section-heading">
        <div>
          <p class="section-kicker">{{ t('home.archiveKicker') }}</p>
          <h2 id="archive-title">{{ t('home.archiveTitle') }}</h2>
        </div>
        <NuxtLink class="soft-link archive-all" :to="$localePath({ name: 'archive' })">{{ t('home.archiveAll') }} <span aria-hidden="true">↗</span></NuxtLink>
      </div>
      <div class="archive-grid">
        <NuxtLink v-for="puzzle in archive" :key="puzzle.date" class="archive-card" :to="puzzlePath(puzzle.date)">
          <img :src="puzzle.imageUrl" :alt="t('home.illustrationAlt', { name: puzzle.imageName })" loading="lazy">
          <div class="archive-card-copy">
            <span>{{ formatPuzzleDate(puzzle.date, { day: 'numeric', month: 'long' }) }}</span>
            <strong>{{ puzzleTitle(puzzle) }}</strong>
          </div>
          <span class="card-open" aria-hidden="true">↗</span>
        </NuxtLink>
      </div>
    </section>

    <p class="prototype-note">{{ t('home.prototypeNote') }}</p>
  </main>
</template>

<script setup lang="ts">
import type { DailyPuzzle } from '#shared/types/puzzle'
import { formatPuzzleDate as formatSharedPuzzleDate } from '#shared/types/puzzle'
definePageMeta({ name: 'index' })
const { $getLocale, $localePath, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')

const { data: puzzles } = await useFetch<DailyPuzzle[]>('/api/puzzles', { key: 'published-puzzles-home' })
const parisToday = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date())
const featured = computed(() => puzzles.value?.find(puzzle => puzzle.date === parisToday))
const archive = computed(() => puzzles.value?.filter(puzzle => puzzle.date < parisToday).slice(0, 2) ?? [])
const language = computed(() => $getLocale() === 'en' ? 'en-US' : 'fr-FR')
const formatPuzzleDateForLocale = (date: string, options?: Intl.DateTimeFormatOptions) => formatSharedPuzzleDate(date, options, language.value)
const puzzlePath = (date: string) => $localePath({ name: 'play', params: { date } })
const puzzleTitle = (puzzle: DailyPuzzle) => $getLocale() === 'en' && puzzle.titleEn ? puzzle.titleEn : puzzle.title
const formatPuzzleDate = (date: string, options?: Intl.DateTimeFormatOptions) => formatPuzzleDateForLocale(date, options)
useSeoMeta({ title: () => t('home.seoTitle'), description: () => t('home.description') })
</script>