<template>
  <main class="page-wrap master-page">
    <div class="master-topline">
      <NuxtLink class="soft-link master-back-link" :to="$localePath({ name: 'index' })">
        {{ t('master.backHome') }}
      </NuxtLink>
      <span v-if="puzzle" class="master-week-label">{{ t('master.kicker', { week: puzzle.weekKey }) }}</span>
    </div>
    <template v-if="puzzle">
      <header class="master-heading">
        <div class="master-heading-copy">
          <h1>{{ displayedTitle }}</h1>
          <p class="master-note">{{ displayedNote || t('master.defaultNote') }}</p>
          <p class="master-format"><span>{{ weekLabel }}</span><span aria-hidden="true">·</span><span>{{ t('master.pieces', { count: puzzle.pieceCount }) }}</span></p>
        </div>
        <div class="master-heading-links">
          <NuxtLink class="master-leaderboard-link" :to="leaderboardPath">{{ t('master.leaderboard') }} <span aria-hidden="true">↗</span></NuxtLink>
        </div>
      </header>
      <p class="sr-only" role="status" aria-live="polite">{{ previewAnnouncement }}</p>
      <div class="master-play-layout">
        <PuzzleBoard :puzzle="puzzle" master-mode />
        <aside v-if="showReferenceImage" class="master-reference-panel" :aria-label="t('play.reference')">
          <span>{{ t('play.reference') }}</span>
          <img :src="puzzle.imageUrl" :alt="t('play.referenceAlt', { name: puzzle.imageName })">
          <a class="master-source-link" :href="`https://zimablue.cc/illustrations/${puzzle.imageSlug}`" target="_blank" rel="noreferrer">
            {{ t('play.viewIllustration') }} <span aria-hidden="true">↗</span>
          </a>
        </aside>
      </div>
    </template>
    <section v-else class="master-empty-state">
      <h1>{{ t('master.emptyTitle') }}</h1>
      <p class="master-empty-week">{{ t('master.kicker', { week: currentWeekKey }) }}</p>
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
  if (event.key.toLowerCase() !== 'a' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
    || event.defaultPrevented || isTextEntryTarget(event.target)) return
  event.preventDefault()
  void preferences.save({ showReferenceImage: !showReferenceImage.value })
  previewAnnouncement.value = t(showReferenceImage.value ? 'play.hideReference' : 'play.showReference')
}

onMounted(() => window.addEventListener('keydown', handlePreviewShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', handlePreviewShortcut))
</script>

<style>
.master-page { display: flex; flex: 1; min-height: calc(100svh - 64px); flex-direction: column; padding-block: 1.1rem 1.4rem; }
.master-topline { display: flex; min-height: 2rem; align-items: center; justify-content: space-between; gap: 1rem; }
.master-back-link { display: inline-flex; align-items: center; gap: .35rem; color: var(--muted); font-size: .75rem; }
.master-back-link:hover { color: var(--blue); }
.master-back-link:focus-visible,.master-leaderboard-link:focus-visible,.master-source-link:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.master-back-link > span { width: .95rem; height: .95rem; }
.master-week-label { color: var(--blue); font-size: .72rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.master-heading { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; margin-block: .65rem 1rem; }
.master-heading-copy { min-width: 0; }
.master-heading h1 { margin: 0; font-size: clamp(1.8rem, 3vw, 2.7rem); line-height: 1.02; font-weight: 850; }
.master-note { max-width: 68ch; margin: .45rem 0; color: var(--muted); font-size: .88rem; line-height: 1.4; }
.master-format { display: flex; flex-wrap: wrap; align-items: center; gap: .55rem; margin: .4rem 0 0; color: var(--muted); font-size: .75rem; font-weight: 700; }
.master-heading-links { display: flex; flex: none; align-items: center; }
.master-leaderboard-link,.master-source-link { color: var(--blue); font-size: .78rem; font-weight: 800; text-decoration-thickness: 1px; text-underline-offset: .18rem; }
.master-play-layout { position: relative; display: grid; flex: 1; min-height: 0; grid-template-columns: minmax(0, 1fr) minmax(12rem, 14rem); align-items: center; gap: 1.5rem; }
.master-play-layout > .game-panel { grid-column: 1 / -1; grid-row: 1; transition: transform .36s cubic-bezier(.2, .8, .25, 1); }
.master-play-layout:has(.master-reference-panel) > .game-panel { transform: translateX(-5rem); }
.master-reference-panel { display: grid; grid-column: 2; grid-row: 1; width: min(100%, 14rem); justify-self: end; align-self: center; gap: .65rem; padding: .75rem; border: 2px solid var(--ink); background: var(--paper); box-shadow: var(--shadow); font-size: .76rem; font-weight: 800; transform: translateX(-9rem); }
.master-reference-panel img { display: block; width: 100%; aspect-ratio: 1; border: 1px solid var(--line); background: var(--paper); object-fit: contain; }
.master-empty-state { display: grid; flex: 1; align-content: center; justify-items: start; max-width: 42rem; margin: 2rem auto; padding: clamp(1.5rem, 5vw, 3rem); border: 2px solid var(--ink); background: var(--yellow); box-shadow: var(--shadow); }
.master-empty-state h1 { margin: .4rem 0; font-size: clamp(2rem, 7vw, 3.5rem); line-height: 1.05; font-weight: 850; }
.master-empty-week { margin: .35rem 0; color: var(--yellow-foreground); font-size: .8rem; font-weight: 800; }
.master-empty-state > p:not(.master-empty-week) { max-width: 42ch; color: var(--yellow-foreground); line-height: 1.6; }
.master-empty-state .play-link { margin-top: .6rem; }
@media (max-width: 1150px) {
  .master-page { min-height: calc(100svh - 58px); padding-block: .7rem 1.2rem; }
  .master-heading { align-items: start; gap: .75rem; margin-block: .5rem .8rem; }
  .master-heading h1 { font-size: clamp(1.65rem, 5vw, 2.2rem); }
  .master-note { margin: .35rem 0; font-size: .8rem; }
  .master-format { margin-top: .3rem; font-size: .7rem; }
  .master-play-layout { display: flex; flex: none; flex-direction: column; align-items: stretch; gap: .85rem; }
  .master-play-layout:has(.master-reference-panel) > .game-panel { transform: none; }
  .master-reference-panel { width: min(100%, 34rem); grid-column: auto; grid-row: auto; grid-template-columns: minmax(0, 1fr) minmax(5.5rem, 7rem); align-items: center; align-self: center; gap: .4rem .7rem; padding: .55rem; font-size: .7rem; transform: none; }
  .master-reference-panel img { grid-column: 2; grid-row: 1 / span 2; width: 100%; }
  .master-source-link { grid-column: 1; font-size: .7rem; }
}
@media (max-width: 600px) {
  .master-topline { min-height: 1.7rem; }
  .master-back-link { font-size: .7rem; }
  .master-week-label { font-size: .66rem; }
  .master-heading { flex-direction: column; }
  .master-heading-links { align-self: start; }
}
@media (prefers-reduced-motion: reduce) { .master-play-layout > .game-panel { transition: none; } }
</style>
