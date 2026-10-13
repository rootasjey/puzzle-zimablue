<template>
  <main class="page-wrap play-page admin-puzzle-preview-page">
    <NuxtLink class="soft-link back-link" :to="$localePath({ name: 'admin-calendar' })">
      {{ t('admin.backToCalendar') }}
    </NuxtLink>
    <div class="admin-preview-banner" role="status">
      <span aria-hidden="true">◉</span>
      <p>{{ t('game.previewNoProgress') }}</p>
      <span class="admin-preview-status">{{ puzzle.status === 'draft' ? t('admin.draft') : t('admin.published') }}</span>
    </div>
    <header class="play-heading">
      <div>
        <p class="section-kicker">{{ formatPuzzleDate(puzzle.date, undefined, language) }}</p>
        <h1>{{ displayedTitle }}</h1>
        <p class="play-note">{{ displayedNote }}</p>
      </div>
      <a class="source-link" :href="`https://zimablue.cc/illustrations/${puzzle.imageSlug}`" target="_blank" rel="noreferrer">{{ t('play.viewIllustration') }} <span aria-hidden="true">↗</span></a>
    </header>
    <div class="play-layout">
      <PuzzleBoard :puzzle="puzzle" :progress-enabled="false" />
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

definePageMeta({ name: 'admin-preview', middleware: 'admin' })
const { $getLocale, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/admin/preview/[date]' } })

const route = useRoute()
const { data, error } = await useFetch<DailyPuzzle>(`/api/admin/puzzles/${route.params.date}`)
if (error.value || !data.value) throw createError({ statusCode: 404, statusMessage: t('play.notFound') })

const puzzle = computed(() => data.value!)
const language = computed(() => $getLocale() === 'en' ? 'en-US' : 'fr-FR')
const displayedTitle = computed(() => $getLocale() === 'en' && puzzle.value.titleEn ? puzzle.value.titleEn : puzzle.value.title)
const displayedNote = computed(() => $getLocale() === 'en' && puzzle.value.noteEn ? puzzle.value.noteEn : puzzle.value.note)
useSeoMeta({ title: () => `${t('admin.previewLabel')} — ${displayedTitle.value}`, description: () => t('play.seoDescription', { name: puzzle.value.imageName }) })
</script>

<style scoped>
.admin-preview-banner {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin: 1.5rem 0 2rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--line);
  background: var(--white);
}

.admin-preview-banner > span:first-child { color: var(--blue); }
.admin-preview-banner p { margin: 0; }
.admin-preview-status { margin-left: auto; font-size: 0.875rem; font-weight: 700; }

@media (max-width: 600px) {
  .admin-preview-banner { align-items: flex-start; flex-wrap: wrap; }
  .admin-preview-status { margin-left: auto; }
}
</style>
