<template>
  <main class="page-wrap master-page">
    <template v-if="puzzle">
      <header class="master-heading">
        <NuxtLink class="master-back-link" :to="$localePath({ name: 'index' })" :aria-label="t('master.backHome')">
          <span class="i-lucide-arrow-left" aria-hidden="true" />
        </NuxtLink>
        <div class="master-heading-copy">
          <h1>{{ displayedTitle }}</h1>
          <p class="master-format">
            <span>{{ t('master.kicker', { week: puzzle.weekKey }) }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ t('master.pieces', { count: puzzle.pieceCount }) }}</span>
          </p>
        </div>
      </header>
      <p class="sr-only" role="status" aria-live="polite">{{ previewAnnouncement }}</p>
      <div class="master-play-layout">
        <PuzzleBoard :puzzle="puzzle" master-mode />
        <aside v-if="showReferenceImage" class="master-reference-panel" :aria-label="t('play.reference')">
          <img :src="puzzle.imageUrl" :alt="t('play.referenceAlt', { name: puzzle.imageName })">
        </aside>
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

const { data } = await useFetch<WeeklyPuzzle | null>('/api/master/current', { key: 'weekly-master-current' })
const puzzle = computed(() => data.value ?? null)
const displayedTitle = computed(() => $getLocale() === 'en' && puzzle.value?.titleEn ? puzzle.value.titleEn : puzzle.value?.title ?? '')
const preferences = useAccountPreferences()
const showReferenceImage = computed(() => preferences.preferences.value.showReferenceImage)
const previewAnnouncement = ref('')
const currentDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date())
const currentWeekKey = getIsoWeekKeyForDate(currentDate)
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
.master-page { display: flex; flex: 1; min-height: calc(100svh - 64px); flex-direction: column; padding-block: .55rem .8rem; }
.master-heading { display: flex; align-items: center; gap: .75rem; margin: 0 0 .55rem; }
.master-back-link { display: grid; width: 2.35rem; height: 2.35rem; flex: none; place-items: center; border: 1.5px solid var(--line); color: var(--muted); text-decoration: none; }
.master-back-link:hover { border-color: var(--blue); color: var(--blue); }
.master-back-link:focus-visible,.master-empty-back-link:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.master-back-link > span { display: block; width: 1.1rem; height: 1.1rem; font-size: 1.1rem; }
.master-heading-copy { display: grid; min-width: 0; gap: .2rem; }
.master-heading h1 { overflow: hidden; margin: 0; font-size: clamp(1.7rem, 3vw, 2.35rem); line-height: 1; font-weight: 850; text-overflow: ellipsis; white-space: nowrap; }
.master-format { display: flex; flex-wrap: wrap; align-items: center; gap: .45rem; margin: 0; color: var(--muted); font-size: .72rem; font-weight: 700; }
.master-format span:first-child { color: var(--blue); }
.master-play-layout { position: relative; display: grid; flex: 1; min-height: 0; grid-template-columns: minmax(0, 1fr) minmax(11rem, 13rem); align-items: center; gap: 1.25rem; }
.master-play-layout > .game-panel { grid-column: 1 / -1; grid-row: 1; transition: transform .36s cubic-bezier(.2, .8, .25, 1); }
.master-play-layout:has(.master-reference-panel) > .game-panel { transform: translateX(-5rem); }
.master-reference-panel { display: grid; grid-column: 2; grid-row: 1; width: min(100%, 13rem); justify-self: end; align-self: center; padding: .4rem; border: 1px solid var(--line); background: var(--paper); transform: translateX(-8rem); }
.master-reference-panel img { display: block; width: 100%; aspect-ratio: 1; border: 1px solid var(--line); background: var(--paper); object-fit: contain; }
.master-empty-back-link { display: inline-flex; align-items: center; gap: .35rem; color: var(--yellow-foreground); font-size: .78rem; font-weight: 750; text-decoration-thickness: 1px; text-underline-offset: .15rem; }
.master-empty-state { display: grid; flex: 1; align-content: center; justify-items: start; max-width: 42rem; margin: 2rem auto; padding: clamp(1.5rem, 5vw, 3rem); border: 2px solid var(--ink); background: var(--yellow); box-shadow: var(--shadow); }
.master-empty-state h1 { margin: .4rem 0; font-size: clamp(2rem, 7vw, 3.5rem); line-height: 1.05; font-weight: 850; }
.master-empty-week { margin: .35rem 0; color: var(--yellow-foreground); font-size: .8rem; font-weight: 800; }
.master-empty-state > p:not(.master-empty-week) { max-width: 42ch; color: var(--yellow-foreground); line-height: 1.6; }
.master-empty-state .play-link { margin-top: .6rem; }
@media (max-width: 1150px) {
  .master-page { min-height: calc(100svh - 58px); padding-block: .35rem .75rem; }
  .master-heading { gap: .6rem; margin-bottom: .45rem; }
  .master-heading h1 { font-size: clamp(1.6rem, 5vw, 2.05rem); }
  .master-format { font-size: .68rem; }
  .master-play-layout { display: flex; flex: none; flex-direction: column; align-items: stretch; gap: .85rem; }
  .master-play-layout:has(.master-reference-panel) > .game-panel { transform: none; }
  .master-reference-panel { width: min(100%, 16rem); grid-column: auto; grid-row: auto; align-self: center; padding: .35rem; transform: none; }
}
@media (max-width: 600px) {
  .master-page { padding-inline: max(.75rem, env(safe-area-inset-left)) max(.75rem, env(safe-area-inset-right)); }
  .master-back-link { width: 2.2rem; height: 2.2rem; }
  .master-heading h1 { font-size: clamp(1.45rem, 6vw, 1.9rem); }
}
@media (prefers-reduced-motion: reduce) { .master-play-layout > .game-panel { transition: none; } }
</style>
