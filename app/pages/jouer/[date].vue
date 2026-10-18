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
    <p class="sr-only" role="status" aria-live="polite">{{ previewAnnouncement }}</p>
    <div class="play-layout" :class="{ 'is-reference-hidden': !showReferenceImage }">
      <PuzzleBoard :puzzle="puzzle" />
      <aside v-if="showReferenceImage" class="reference-panel">
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
const preferences = useAccountPreferences()
const showReferenceImage = computed(() => preferences.preferences.value.showReferenceImage)
const previewAnnouncement = ref('')
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

function handlePreviewShortcut(event: KeyboardEvent) {
  if (event.key.toLowerCase() !== 'a' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
    || event.defaultPrevented || isTextEntryTarget(event.target)) return
  event.preventDefault()
  const nextValue = !showReferenceImage.value
  previewAnnouncement.value = t(nextValue ? 'play.showReference' : 'play.hideReference')
  void preferences.save({ showReferenceImage: nextValue })
}

onMounted(() => window.addEventListener('keydown', handlePreviewShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', handlePreviewShortcut))
</script>

<style>
.source-link:focus-visible { outline: 3px solid var(--coral); outline-offset: 4px; }
.play-page { flex: 1; padding-top: clamp(2rem, 5vw, 3.7rem); padding-bottom: 5rem; }
.play-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1.7rem; }
.play-heading h1 { font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 850; }
.play-note { margin: .55rem 0 0; color: var(--muted); }
.source-link { margin-bottom: .35rem; color: var(--blue); font-size: .82rem; font-weight: 800; text-decoration: none; }
.play-layout { display: grid; grid-template-columns: minmax(0,1fr) 230px; align-items: start; gap: clamp(1rem, 4vw, 2.5rem); }
.play-layout.is-reference-hidden { grid-template-columns: minmax(0, 1fr); }
.play-layout.is-reference-hidden .game-panel { width: min(100%, 850px); justify-self: center; }
.game-panel { min-width: 0; }
.board-tools { display: flex; width: min(100%, var(--board-max-width, 590px)); min-height: 2.5rem; align-items: center; justify-content: space-between; gap: .8rem; margin: .55rem auto 0; }
.board-session-summary { display: grid; min-width: 0; gap: .12rem; }
.session-save-status { max-width: 34ch; margin: 0; color: var(--muted); font-size: .66rem; line-height: 1.25; }
.session-save-status.is-conflict, .session-save-status.is-error { color: var(--coral); }
.board-tool-actions { display: flex; align-items: center; gap: .6rem; }
.reference-toggle svg { width: 1.05rem; height: 1.05rem; }
.sound-toggle { display: grid; width: 2.15rem; height: 2.15rem; flex: none; place-items: center; border: 1px solid var(--line); border-radius: 50%; background: var(--white); color: var(--muted); cursor: pointer; transition: transform .15s ease, border-color .15s ease, background-color .15s ease, color .15s ease; }
.sound-toggle[aria-pressed="true"] { border-color: var(--blue); background: var(--paper); color: var(--blue); }
.sound-toggle:hover { transform: translateY(-1px); color: var(--ink); }
.sound-toggle:active { transform: translateY(1px); }
.sound-toggle:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.sound-toggle svg { width: 1.1rem; height: 1.1rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
.move-count, .success-note { margin: 0; color: var(--muted); font-size: .8rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.move-limit-note { margin: 0; color: var(--coral); font-size: .75rem; font-weight: 700; }
.success-note { color: var(--success); }
.restart-icon-button { display: grid; width: 2.3rem; height: 2.3rem; place-items: center; border: 1px solid var(--line); border-radius: 50%; background: var(--white); color: var(--blue); cursor: pointer; transition: transform .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease; }
.restart-icon-button:hover { transform: translateY(-1px); border-color: var(--blue); color: var(--coral); }
.restart-icon-button:active { transform: translate(1px, 1px); box-shadow: none; }
.restart-icon-button:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.restart-icon-button svg { width: 1.1rem; height: 1.1rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
@media (max-width: 760px) {
  .play-layout { grid-template-columns: 1fr; }
  .play-heading { align-items: start; } }
@media (max-width: 470px) {
  .play-page { padding-inline: 1.1rem; }
  .play-heading { display: block; }
  .source-link { display: inline-block; margin-top: .9rem; } }
</style>
