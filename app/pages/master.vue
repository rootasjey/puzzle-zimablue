<template>
  <main class="page-wrap master-page">
    <template v-if="puzzle">
      <p class="sr-only" role="status" aria-live="polite">{{ previewAnnouncement }}</p>
      <div class="master-play-layout">
        <PuzzleBoard :puzzle="puzzle" master-mode />
      </div>
    </template>
    <section v-else class="master-empty-state">
      <NuxtLink class="master-empty-back-link" :to="$localePath({ name: 'index' })">
        {{ t('master.backHome') }}
      </NuxtLink>
      <h1>{{ t('master.emptyTitle') }}</h1>
      <p class="master-empty-week">{{ t('master.kicker', { week: currentWeekKey }) }}</p>
      <p>{{ t('master.emptyDescription') }}</p>
      <NuxtLink class="play-link" :to="$localePath({ name: 'index' })">{{ t('master.backHome') }} <span aria-hidden="true">↗</span></NuxtLink>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { WeeklyPuzzle } from '#shared/types/puzzle'
import { getIsoWeekKeyForDate } from '#shared/utils/iso-week'

definePageMeta({ name: 'master' })
const { $getLocale, $t, $localePath } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/master' } })

const route = useRoute()
const gameplayHeader = useGameplayHeader()
const gameplayRoutePath = route.path
const { data } = await useFetch<WeeklyPuzzle | null>('/api/master/current', { key: 'weekly-master-current' })
const puzzle = computed(() => data.value ?? null)
const displayedTitle = computed(() => $getLocale() === 'en' && puzzle.value?.titleEn ? puzzle.value.titleEn : puzzle.value?.title ?? '')
const preferences = useAccountPreferences()
const showReferenceImage = computed(() => preferences.preferences.value.showReferenceImage)
const previewAnnouncement = ref('')
const puzzleFormatLabel = computed(() => t('play.gridSummary', {
  rows: puzzle.value?.gridRows ?? 0,
  columns: puzzle.value?.gridColumns ?? 0,
  count: puzzle.value?.pieceCount ?? 0,
}))
const currentDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date())
const currentWeekKey = getIsoWeekKeyForDate(currentDate)
usePageSeo({ title: () => displayedTitle.value || t('master.emptyTitle'), description: () => t('master.seoDescription') })

watchEffect(() => {
  if (!puzzle.value) {
    gameplayHeader.clear(gameplayRoutePath)
    return
  }
  gameplayHeader.set({
    routePath: gameplayRoutePath,
    title: displayedTitle.value,
    details: [
      { label: t('play.weekLabel'), value: t('master.kicker', { week: puzzle.value.weekKey }) },
      { label: t('play.formatLabel'), value: puzzleFormatLabel.value },
    ],
  })
})

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
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handlePreviewShortcut)
  gameplayHeader.clear(gameplayRoutePath)
})
</script>

<style>
.master-page { display: flex; flex: 1; min-height: calc(100svh - 64px); flex-direction: column; padding-block: .2rem .8rem; }
.master-play-layout { display: flex; flex: 1; min-height: 0; align-items: center; justify-content: center; }
.master-play-layout > .game-panel { width: 100%; }
.master-empty-back-link { display: inline-flex; align-items: center; gap: .35rem; color: var(--yellow-foreground); font-size: .78rem; font-weight: 750; text-decoration-thickness: 1px; text-underline-offset: .15rem; }
.master-empty-back-link:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.master-empty-state { display: grid; flex: 1; align-content: center; justify-items: start; max-width: 42rem; margin: 2rem auto; padding: clamp(1.5rem, 5vw, 3rem); border: 2px solid var(--ink); background: var(--yellow); box-shadow: var(--shadow); }
.master-empty-state h1 { margin: .4rem 0; font-size: clamp(2rem, 7vw, 3.5rem); line-height: 1.05; font-weight: 850; }
.master-empty-week { margin: .35rem 0; color: var(--yellow-foreground); font-size: .8rem; font-weight: 800; }
.master-empty-state > p:not(.master-empty-week) { max-width: 42ch; color: var(--yellow-foreground); line-height: 1.6; }
.master-empty-state .play-link { margin-top: .6rem; }
@media (max-width: 1150px) {
  .master-page { min-height: calc(100svh - 58px); padding-block: .15rem .75rem; }
}
@media (max-width: 600px) {
  .master-page { padding-inline: max(.75rem, env(safe-area-inset-left)) max(.75rem, env(safe-area-inset-right)); }
}
</style>
