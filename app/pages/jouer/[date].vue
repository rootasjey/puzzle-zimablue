<template>
  <main class="page-wrap play-page">
    <NuxtLink class="soft-link back-link" :to="$localePath({ name: 'archive' })">
      {{ t('play.back') }}
    </NuxtLink>
    <header class="play-heading">
      <div>
        <p class="section-kicker">{{ formatPuzzleDate(puzzle.date, undefined, language) }}</p>
        <h1>{{ displayedTitle }}</h1>
        <p class="play-note">{{ displayedNote }}</p>
      </div>
      <a class="source-link" :href="`https://zimablue.cc/illustrations/${puzzle.imageSlug}`" target="_blank" rel="noreferrer">{{ t('play.viewIllustration') }} <span aria-hidden="true">↗</span></a>
    </header>
    <div class="play-layout">
      <PuzzleBoard :puzzle="puzzle" />
      <aside class="reference-panel">
        <span class="reference-label">{{ t('play.reference') }}</span>
        <img :src="puzzle.imageUrl" :alt="t('play.referenceAlt', { name: puzzle.imageName })">
      </aside>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { DailyPuzzle } from '#shared/types/puzzle'
import { formatPuzzleDate } from '#shared/types/puzzle'
definePageMeta({ name: 'play' })
const { $getLocale, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/play/[date]' } })

const route = useRoute()
const { data: puzzleData, error } = await useFetch<DailyPuzzle>(`/api/puzzles/${route.params.date}`)
if (error.value || !puzzleData.value) throw createError({ statusCode: 404, statusMessage: t('play.notFound') })
const puzzle = computed(() => puzzleData.value!)
const language = computed(() => $getLocale() === 'en' ? 'en-US' : 'fr-FR')
const displayedTitle = computed(() => $getLocale() === 'en' && puzzle.value.titleEn ? puzzle.value.titleEn : puzzle.value.title)
const displayedNote = computed(() => $getLocale() === 'en' && puzzle.value.noteEn ? puzzle.value.noteEn : puzzle.value.note)
useSeoMeta({ title: () => displayedTitle.value, description: () => t('play.seoDescription', { name: puzzle.value.imageName }) })
</script>
