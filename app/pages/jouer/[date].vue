<template>
  <main class="page-wrap play-page">
    <p class="sr-only" role="status" aria-live="polite">{{ previewAnnouncement }}</p>
    <div class="play-stage">
      <PuzzleBoard :puzzle="puzzle" />
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
const gameplayHeader = useGameplayHeader()
const gameplayRoutePath = route.path
const { data: puzzleData, error } = await useFetch<DailyPuzzle>(`/api/puzzles/${route.params.date}`)
if (error.value || !puzzleData.value) throw createError({ statusCode: 404, statusMessage: t('play.notFound') })
const puzzle = computed(() => puzzleData.value!)
const language = computed(() => $getLocale() === 'en' ? 'en-US' : 'fr-FR')
const displayedTitle = computed(() => $getLocale() === 'en' && puzzle.value.titleEn ? puzzle.value.titleEn : puzzle.value.title)
const preferences = useAccountPreferences()
const showReferenceImage = computed(() => preferences.preferences.value.showReferenceImage)
const previewAnnouncement = ref('')
const puzzleDateLabel = computed(() => formatPuzzleDate(puzzle.value.date, { day: 'numeric', month: 'long', year: 'numeric' }, language.value))
const puzzleFormatLabel = computed(() => t('play.gridSummary', {
  rows: puzzle.value.gridRows,
  columns: puzzle.value.gridColumns,
  count: puzzle.value.pieceCount,
}))

watchEffect(() => {
  if (!puzzle.value) return
  gameplayHeader.set({
    routePath: gameplayRoutePath,
    title: displayedTitle.value,
    details: [
      { label: t('play.dateLabel'), value: puzzleDateLabel.value },
      { label: t('play.formatLabel'), value: puzzleFormatLabel.value },
    ],
  })
})

usePageSeo({
  title: () => displayedTitle.value,
  description: () => t('play.seoDescription', { name: puzzle.value.imageName }),
})
defineOgImage('Puzzle.takumi', {
  title: displayedTitle,
  image: computed(() => puzzle.value.imageUrl),
  imageAlt: computed(() => t('play.referenceAlt', { name: puzzle.value.imageName })),
}, [{ key: 'og', alt: computed(() => t('play.referenceAlt', { name: puzzle.value.imageName })) }])

function isTextEntryTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')))
}

async function handlePreviewShortcut(event: KeyboardEvent) {
  if (event.key.toLowerCase() !== 'a' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
    || event.defaultPrevented || isTextEntryTarget(event.target)) return
  event.preventDefault()
  const nextValue = !showReferenceImage.value
  previewAnnouncement.value = t(nextValue ? 'play.showReference' : 'play.hideReference')
  await preferences.save({ showReferenceImage: nextValue })
}

onMounted(() => window.addEventListener('keydown', handlePreviewShortcut))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handlePreviewShortcut)
  gameplayHeader.clear(gameplayRoutePath)
})
</script>

<style>
.play-page { box-sizing: border-box; display: flex; flex: 1; min-height: calc(100svh - 64px); flex-direction: column; padding-top: .3rem; padding-bottom: .45rem; }
.play-stage { display: flex; flex: 1; min-height: 0; align-items: center; justify-content: center; }
.play-stage > .game-panel { width: 100%; }
.board-tools { display: flex; width: min(100%, var(--board-max-width, 590px)); min-height: 2.5rem; align-items: center; justify-content: space-between; gap: .8rem; margin: .55rem auto 0; }
.board-session-summary { display: grid; min-width: 0; gap: .12rem; }
.session-save-status { max-width: 34ch; margin: 0; color: var(--muted); font-size: .66rem; line-height: 1.25; }
.session-save-status.is-conflict, .session-save-status.is-error { color: var(--coral); }
.board-tool-actions { display: flex; align-items: center; gap: .6rem; }
.sound-toggle { display: grid; width: 2.15rem; height: 2.15rem; flex: none; place-items: center; border: 1px solid var(--line); border-radius: 50%; background: var(--white); color: var(--muted); cursor: pointer; transition: transform .15s ease, border-color .15s ease, background-color .15s ease, color .15s ease; }
.sound-toggle:not(.reference-toggle) { border-radius: 0; }
.sound-toggle[aria-pressed="true"] { border-color: var(--blue); background: var(--paper); color: var(--blue); }
.sound-toggle:hover { transform: translateY(-1px); color: var(--ink); }
.sound-toggle:active { transform: translateY(1px); }
.sound-toggle:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.sound-toggle svg { width: 1.1rem; height: 1.1rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
.restart-icon-button { display: grid; width: 2.3rem; height: 2.3rem; place-items: center; border: 1px solid var(--line); border-radius: 0; background: var(--white); color: var(--blue); cursor: pointer; transition: transform .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease; }
.restart-icon-button:hover { transform: translateY(-1px); border-color: var(--blue); color: var(--coral); }
.restart-icon-button:active { transform: translate(1px, 1px); box-shadow: none; }
.restart-icon-button:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.restart-icon-button svg { width: 1.1rem; height: 1.1rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
@media (max-width: 760px) {
  .play-page { min-height: calc(100svh - 58px); padding-top: .2rem; padding-bottom: .35rem; }
  .play-stage { align-content: center; }
}
@media (max-width: 470px) { .play-page { padding-inline: .9rem; } }
</style>
