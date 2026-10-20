<template>
  <main class="page-wrap play-page">
    <header class="play-heading">
      <NuxtLink class="play-back-link" :to="$localePath({ name: 'archive' })" :aria-label="t('play.back')">
        <span class="i-lucide-arrow-left" aria-hidden="true" />
        <span>{{ t('play.back') }}</span>
      </NuxtLink>
      <div class="play-identity">
        <h1>{{ displayedTitle }}</h1>
        <time :datetime="puzzle.date">{{ formatPuzzleDate(puzzle.date, undefined, language) }}</time>
      </div>
    </header>
    <p class="sr-only" role="status" aria-live="polite">{{ previewAnnouncement }}</p>
    <div class="play-stage">
      <PuzzleBoard :puzzle="puzzle" :show-reference-toggle="false" />
      <details v-if="showReferenceImage" ref="referenceDetails" class="reference-disclosure">
        <summary>
          <span>{{ t('play.reference') }}</span>
          <span class="i-lucide-chevron-down reference-chevron" aria-hidden="true" />
        </summary>
        <div class="reference-preview">
          <img :src="puzzle.imageUrl" :alt="t('play.referenceAlt', { name: puzzle.imageName })" loading="lazy" decoding="async">
          <a class="source-link" :href="`https://zimablue.cc/illustrations/${puzzle.imageSlug}`" target="_blank" rel="noreferrer">
            {{ t('play.viewIllustration') }} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </details>
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
const preferences = useAccountPreferences()
const showReferenceImage = computed(() => preferences.preferences.value.showReferenceImage)
const previewAnnouncement = ref('')
const referenceDetails = ref<HTMLDetailsElement>()
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
  if (!nextValue && referenceDetails.value) referenceDetails.value.open = false
  await preferences.save({ showReferenceImage: nextValue })
  if (nextValue) {
    await nextTick()
    if (referenceDetails.value) referenceDetails.value.open = true
  }
}

onMounted(() => window.addEventListener('keydown', handlePreviewShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', handlePreviewShortcut))
</script>

<style>
.source-link:focus-visible { outline: 3px solid var(--coral); outline-offset: 4px; }
.play-page { box-sizing: border-box; display: flex; flex: 1; min-height: calc(100svh - 64px); flex-direction: column; padding-top: .4rem; padding-bottom: .45rem; }
.play-heading { display: grid; min-height: 3.25rem; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 1rem; }
.play-back-link { display: inline-flex; grid-column: 1; align-items: center; justify-self: start; gap: .4rem; color: var(--muted); font-size: .75rem; font-weight: 750; text-decoration: none; }
.play-back-link:hover { color: var(--blue); }
.play-back-link:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.play-back-link > span:first-child { width: 1rem; height: 1rem; flex: none; }
.play-identity { grid-column: 2; grid-row: 1; min-width: 0; max-width: min(48vw, 32rem); text-align: center; }
.play-heading h1 { overflow: hidden; margin: 0; font-size: clamp(1.15rem, 1.8vw, 1.45rem); font-weight: 850; line-height: 1.15; text-overflow: ellipsis; white-space: nowrap; }
.play-identity time { display: block; margin-top: .12rem; color: var(--muted); font-size: .68rem; line-height: 1.2; }
.play-stage { --play-stage-gap: clamp(1rem, 3vw, 2rem); display: grid; flex: 1; min-height: 0; grid-template-columns: minmax(0, min(57.5rem, calc(100svh - 15rem), calc(100% - 14rem - var(--play-stage-gap)))) minmax(14rem, 19rem); align-items: center; justify-content: center; gap: var(--play-stage-gap); }
.play-stage > .game-panel { grid-column: 1 / -1; grid-row: 1; transition: transform .36s cubic-bezier(.2, .8, .25, 1); }
.play-stage > .reference-disclosure { grid-column: 2; grid-row: 1; }
.play-stage > .reference-disclosure:not([open]) summary { justify-content: flex-end; }
@media (min-width: 761px) {
  .play-stage:has(.reference-disclosure[open]) > .game-panel { transform: translateX(calc(-9.5rem - clamp(.5rem, 1.5vw, 1rem))); }
}
@media (prefers-reduced-motion: reduce) { .play-stage > .game-panel { transition: none; } }
.game-panel { width: 100%; min-width: 0; }
.board-tools { display: flex; width: min(100%, var(--board-max-width, 590px)); min-height: 2.5rem; align-items: center; justify-content: space-between; gap: .8rem; margin: .55rem auto 0; }
.board-session-summary { display: grid; min-width: 0; gap: .12rem; }
.session-save-status { max-width: 34ch; margin: 0; color: var(--muted); font-size: .66rem; line-height: 1.25; }
.session-save-status.is-conflict, .session-save-status.is-error { color: var(--coral); }
.board-tool-actions { display: flex; align-items: center; gap: .6rem; }
.reference-toggle svg { width: 1.05rem; height: 1.05rem; }
.sound-toggle { display: grid; width: 2.15rem; height: 2.15rem; flex: none; place-items: center; border: 1px solid var(--line); border-radius: 50%; background: var(--white); color: var(--muted); cursor: pointer; transition: transform .15s ease, border-color .15s ease, background-color .15s ease, color .15s ease; }
.sound-toggle:not(.reference-toggle) { border-radius: 0; }
.sound-toggle[aria-pressed="true"] { border-color: var(--blue); background: var(--paper); color: var(--blue); }
.sound-toggle:hover { transform: translateY(-1px); color: var(--ink); }
.sound-toggle:active { transform: translateY(1px); }
.sound-toggle:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.sound-toggle svg { width: 1.1rem; height: 1.1rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
.move-count, .success-note { margin: 0; color: var(--muted); font-size: .8rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.move-limit-note { margin: 0; color: var(--coral); font-size: .75rem; font-weight: 700; }
.success-note { color: var(--success); }
.restart-icon-button { display: grid; width: 2.3rem; height: 2.3rem; place-items: center; border: 1px solid var(--line); border-radius: 0; background: var(--white); color: var(--blue); cursor: pointer; transition: transform .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease; }
.restart-icon-button:hover { transform: translateY(-1px); border-color: var(--blue); color: var(--coral); }
.restart-icon-button:active { transform: translate(1px, 1px); box-shadow: none; }
.restart-icon-button:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.restart-icon-button svg { width: 1.1rem; height: 1.1rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
.reference-disclosure { width: 100%; max-width: 20rem; align-self: start; justify-self: center; margin: .25rem 0 0; color: var(--ink); font-size: .76rem; }
.reference-disclosure summary { display: flex; min-height: 2.1rem; align-items: center; justify-content: flex-start; gap: .4rem; color: var(--blue); font-weight: 800; cursor: pointer; list-style: none; }
.reference-disclosure summary::-webkit-details-marker { display: none; }
.reference-disclosure summary:focus-visible { outline: 3px solid var(--coral); outline-offset: 2px; }
.reference-chevron { width: .9rem; height: .9rem; transition: transform .18s ease; }
.reference-disclosure[open] .reference-chevron { transform: rotate(180deg); }
.reference-preview { display: grid; min-height: 4.5rem; justify-items: center; gap: .75rem; padding: .65rem; border: 2px solid var(--ink); background: transparent; box-shadow: 2px 2px 0 var(--ink); }
.reference-preview img { display: block; width: 100%; max-width: 20rem; max-height: 38svh; border: 1px solid var(--ink); background: var(--white); object-fit: contain; }
.source-link { color: var(--blue); font-size: .78rem; font-weight: 800; text-decoration: underline; text-underline-offset: .18em; }
@media (max-width: 760px) {
  .play-page { min-height: calc(100svh - 58px); padding-top: .2rem; padding-bottom: .35rem; }
  .play-heading { min-height: 3rem; grid-template-columns: minmax(0, 1fr) auto; gap: .65rem; }
  .play-identity { grid-column: 2; max-width: 66vw; text-align: right; }
  .play-heading h1 { font-size: 1.1rem; }
  .play-back-link { gap: .28rem; font-size: .68rem; white-space: nowrap; }
  .play-stage { grid-template-columns: minmax(0, 1fr); align-content: center; gap: .45rem; }
  .play-stage > .game-panel { grid-column: 1; }
  .play-stage > .reference-disclosure { grid-column: 1; grid-row: 2; width: min(100%, 36rem); max-width: none; align-self: auto; }
  .reference-disclosure summary { justify-content: center; }
  .reference-preview { display: grid; min-height: 0; grid-template-columns: 1fr; justify-items: center; gap: .45rem; padding: 0; border: 0; background: transparent; box-shadow: none; }
  .reference-preview img { width: min(8rem, 40vw); max-height: 24svh; border: 0; background: transparent; }
}
@media (max-width: 470px) {
  .play-page { padding-inline: .9rem; }
  .play-heading { grid-template-columns: auto minmax(0, 1fr); }
  .play-identity { max-width: none; }
  .play-heading h1 { font-size: 1rem; }
  .play-back-link > span:last-child { display: none; }
}
</style>
