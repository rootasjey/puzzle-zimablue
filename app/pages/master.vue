<template>
  <main class="page-wrap master-page">
    <NuxtLink class="soft-link master-back-link" :to="$localePath({ name: 'index' })">{{ t('master.backHome') }}</NuxtLink>
    <template v-if="puzzle">
      <header class="master-heading">
        <div>
          <p class="section-kicker">{{ t('master.kicker', { week: puzzle.weekKey }) }}</p>
          <h1>{{ displayedTitle }}</h1>
          <p class="master-note">{{ displayedNote || t('master.defaultNote') }}</p>
          <p class="master-format">{{ weekLabel }} <span>·</span> {{ t('master.pieces', { count: puzzle.pieceCount }) }}</p>
        </div>
        <div class="master-heading-links">
          <NuxtLink class="master-leaderboard-link" :to="leaderboardPath">{{ t('master.leaderboard') }} <span aria-hidden="true">↗</span></NuxtLink>
          <a class="master-source-link" :href="`https://zimablue.cc/illustrations/${puzzle.imageSlug}`" target="_blank" rel="noreferrer">{{ t('play.viewIllustration') }} <span aria-hidden="true">↗</span></a>
        </div>
      </header>
      <p class="sr-only" role="status" aria-live="polite">{{ previewAnnouncement }}</p>
      <div class="master-play-layout">
        <PuzzleBoard :puzzle="puzzle" master-mode />
        <aside v-if="showReferenceImage" class="master-reference-panel">
          <span>{{ t('play.reference') }}</span>
          <img :src="puzzle.imageUrl" :alt="t('play.referenceAlt', { name: puzzle.imageName })">
        </aside>
      </div>
    </template>
    <section v-else class="master-empty-state">
      <p class="section-kicker">{{ t('master.kicker', { week: currentWeekKey }) }}</p>
      <h1>{{ t('master.emptyTitle') }}</h1>
      <p>{{ t('master.emptyDescription') }}</p>
      <NuxtLink class="play-link" :to="$localePath({ name: 'index' })">{{ t('master.backHome') }} <span aria-hidden="true">↗</span></NuxtLink>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { WeeklyPuzzle } from '#shared/types/puzzle'
import { formatPuzzleDate } from '#shared/types/puzzle'
import { getIsoWeekKeyForDate } from '#shared/utils/iso-week'

definePageMeta({ name: 'master' })
const { $getLocale, $t, $localePath } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/master' } })

const { data } = await useFetch<WeeklyPuzzle | null>('/api/master/current', { key: 'weekly-master-current' })
const puzzle = computed(() => data.value ?? null)
const displayedTitle = computed(() => $getLocale() === 'en' && puzzle.value?.titleEn ? puzzle.value.titleEn : puzzle.value?.title ?? '')
const displayedNote = computed(() => $getLocale() === 'en' && puzzle.value?.noteEn ? puzzle.value.noteEn : puzzle.value?.note ?? '')
const preferences = useAccountPreferences()
const showReferenceImage = computed(() => preferences.preferences.value.showReferenceImage)
const previewAnnouncement = ref('')
const language = computed(() => $getLocale() === 'en' ? 'en-US' : 'fr-FR')
const currentDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date())
const currentWeekKey = getIsoWeekKeyForDate(currentDate)
const weekLabel = computed(() => {
  if (!puzzle.value) return ''
  const end = new Date(`${puzzle.value.weekStart}T12:00:00Z`)
  end.setUTCDate(end.getUTCDate() + 6)
  return `${formatPuzzleDate(puzzle.value.weekStart, { day: 'numeric', month: 'long' }, language.value)} – ${formatPuzzleDate(end.toISOString().slice(0, 10), { day: 'numeric', month: 'long' }, language.value)}`
})
const leaderboardPath = computed(() => $localePath({ name: 'master-leaderboard-weekKey', params: { weekKey: puzzle.value?.weekKey ?? '' } }))
usePageSeo({ title: () => displayedTitle.value || t('master.emptyTitle'), description: () => t('master.seoDescription') })

function isTextEntryTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')))
}

function handlePreviewShortcut(event: KeyboardEvent) {
  if (event.key.toLowerCase() !== 'a' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || isTextEntryTarget(event.target)) return
  void preferences.save({ showReferenceImage: !showReferenceImage.value })
  previewAnnouncement.value = t(showReferenceImage.value ? 'play.referenceHidden' : 'play.referenceShown')
}

onMounted(() => window.addEventListener('keydown', handlePreviewShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', handlePreviewShortcut))
</script>

<style>
.master-page { flex: 1; padding-block: 2.2rem 4rem; }
.master-back-link { display: inline-flex; }
.master-heading { display: flex; align-items: end; justify-content: space-between; gap: 1.5rem; margin-block: 2rem 1.4rem; }
.master-heading h1 { margin: .4rem 0; font-size: clamp(2rem, 4vw, 3.5rem); line-height: 1.02; font-weight: 850; }
.master-note { margin: .7rem 0; color: var(--muted); line-height: 1.55; }
.master-format { color: var(--muted); font-size: .82rem; font-weight: 700; }
.master-format span { padding-inline: .4rem; }
.master-heading-links { display: grid; justify-items: end; gap: .7rem; flex: none; padding-bottom: .2rem; }
.master-leaderboard-link, .master-source-link { color: var(--blue); font-size: .82rem; font-weight: 800; text-decoration-thickness: 1px; text-underline-offset: .18rem; }
.master-play-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(150px, 220px); align-items: start; gap: clamp(1rem, 3vw, 2rem); }
.master-play-layout:has(.is-reference-hidden) { grid-template-columns: minmax(0, 1fr); }
.master-reference-panel { display: grid; gap: .65rem; padding: .75rem; border: 2px solid var(--ink); background: var(--yellow); box-shadow: var(--shadow); font-size: .76rem; font-weight: 800; }
.master-reference-panel img { display: block; width: 100%; aspect-ratio: 1; border: 2px solid var(--ink); object-fit: cover; }
.master-empty-state { display: grid; justify-items: start; max-width: 42rem; margin: clamp(4rem, 16vh, 9rem) auto; padding: clamp(1.5rem, 5vw, 3rem); border: 2px solid var(--ink); background: var(--yellow); box-shadow: var(--shadow); }
.master-empty-state h1 { margin: .4rem 0; font-size: clamp(2rem, 7vw, 3.5rem); line-height: 1.05; font-weight: 850; }
.master-empty-state > p:not(.section-kicker) { max-width: 42ch; color: var(--yellow-foreground); line-height: 1.6; }
.master-empty-state .play-link { margin-top: .6rem; }
@media (max-width: 760px) {
  .master-page { padding-block: 1.25rem 3rem; }
  .master-heading { align-items: start; flex-direction: column; gap: .75rem; margin-block: 1rem .85rem; }
  .master-heading h1 { font-size: clamp(2rem, 9vw, 2.8rem); }
  .master-note { margin: .45rem 0; line-height: 1.4; }
  .master-format { margin: .25rem 0; }
  .master-heading-links { display: flex; flex-wrap: wrap; justify-items: start; }
  .master-play-layout, .master-play-layout:has(.is-reference-hidden) { grid-template-columns: minmax(0, 1fr); }
  .master-reference-panel { grid-template-columns: 1fr 90px; align-items: center; }
  .master-reference-panel img { grid-column: 2; grid-row: 1 / span 2; width: 90px; height: 90px; }
}
</style>
