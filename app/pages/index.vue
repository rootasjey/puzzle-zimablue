<template>
  <main class="page-wrap home-page">
    <section v-if="featured" class="daily-feature">
      <NuxtLink class="feature-art-link" :to="puzzlePath(featured.date)" :aria-label="t('home.playToday')">
        <div class="feature-art">
          <img :src="featured.imageUrl" :alt="t('home.illustrationAlt', { name: featured.imageName })" fetchpriority="high">
          <span class="art-index">{{ formatPuzzleDate(featured.date, { day: 'numeric', month: 'numeric' }) }}</span>
        </div>
      </NuxtLink>
      <div class="feature-copy">
        <p class="section-kicker">{{ t('home.kicker') }}</p>
        <h1>{{ t('home.titleFirst') }}<br>{{ t('home.titleJoin') }} <em>{{ t('home.titleColor') }}</em></h1>
        <p class="feature-description">{{ t('home.description') }}</p>
        <div class="today-line">{{ formatPuzzleDate(featured.date) }} <span class="line-divider">·</span> {{ t('home.pieces', { count: featured.pieceCount }) }}</div>
        <NuxtLink class="play-link" :to="puzzlePath(featured.date)">{{ t('home.playToday') }} <span aria-hidden="true">↗</span></NuxtLink>
        <NuxtLink class="leaderboard-home-link" :to="$localePath({ name: 'leaderboard' })">{{ t('leaderboard.link') }}</NuxtLink>
      </div>
    </section>
    <p v-else class="empty-state">{{ t('home.empty') }}</p>

    <section v-if="weeklyMaster" class="master-home-feature" aria-labelledby="master-home-title">
      <NuxtLink class="master-home-art" :to="$localePath({ name: 'master' })" :aria-label="t('home.masterPlay')">
        <img :src="weeklyMaster.imageUrl" :alt="t('home.illustrationAlt', { name: weeklyMaster.imageName })" loading="lazy">
        <span>{{ weeklyMaster.weekKey }}</span>
      </NuxtLink>
      <div>
        <p class="section-kicker">{{ t('home.masterKicker') }}</p>
        <h2 id="master-home-title">{{ t('home.masterTitle') }}</h2>
        <p>{{ t('home.masterDescription') }}</p>
        <NuxtLink class="play-link" :to="$localePath({ name: 'master' })">{{ t('home.masterPlay') }} <span aria-hidden="true">↗</span></NuxtLink>
      </div>
    </section>

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
import type { DailyPuzzle, WeeklyPuzzle } from '#shared/types/puzzle'
import { formatPuzzleDate as formatSharedPuzzleDate } from '#shared/types/puzzle'
definePageMeta({ name: 'index' })
const { $getLocale, $localePath, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')

const { data: puzzles } = await useFetch<DailyPuzzle[]>('/api/puzzles', { key: 'published-puzzles-home' })
const { data: weeklyMasterData } = await useFetch<WeeklyPuzzle | null>('/api/master/current', { key: 'weekly-master-home' })
const weeklyMaster = computed(() => weeklyMasterData.value ?? null)
const parisToday = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date())
const featured = computed(() => puzzles.value?.find(puzzle => puzzle.date === parisToday))
const archive = computed(() => puzzles.value?.filter(puzzle => puzzle.date < parisToday).slice(0, 2) ?? [])
const language = computed(() => $getLocale() === 'en' ? 'en-US' : 'fr-FR')
const formatPuzzleDateForLocale = (date: string, options?: Intl.DateTimeFormatOptions) => formatSharedPuzzleDate(date, options, language.value)
const puzzlePath = (date: string) => $localePath({ name: 'play', params: { date } })
const puzzleTitle = (puzzle: DailyPuzzle) => $getLocale() === 'en' && puzzle.titleEn ? puzzle.titleEn : puzzle.title
const formatPuzzleDate = (date: string, options?: Intl.DateTimeFormatOptions) => formatPuzzleDateForLocale(date, options)
usePageSeo({
  title: () => t('home.seoTitle'),
  description: () => t('home.description'),
})
const siteUrl = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
defineOgImage('Puzzle.takumi', {
  title: computed(() => featured.value ? puzzleTitle(featured.value) : t('home.seoTitle')),
  image: computed(() => featured.value?.imageUrl || `${siteUrl}/og-puzzle-zimablue.jpg`),
  imageAlt: computed(() => t('home.illustrationAlt', { name: featured.value?.imageName ?? 'Zimablue' })),
}, [{ key: 'og', alt: computed(() => t('home.illustrationAlt', { name: featured.value?.imageName ?? 'Zimablue' })) }])
</script>

<style>
.home-page { flex: 1; padding-top: clamp(2rem, 5vw, 4rem); padding-bottom: 4rem; }
.daily-feature { display: grid; grid-template-columns: minmax(0, 1.04fr) minmax(280px, .96fr); align-items: center; gap: clamp(2rem, 7vw, 6rem); }
.master-home-feature { display: grid; grid-template-columns: minmax(230px, .65fr) minmax(0, 1fr); align-items: center; gap: clamp(1.5rem, 6vw, 4rem); margin-top: clamp(3rem, 7vw, 5rem); padding: clamp(1rem, 3vw, 2rem); border: 2px solid var(--ink); background: var(--yellow); box-shadow: var(--shadow); }
.master-home-art { position: relative; display: block; min-width: 0; aspect-ratio: 1; border: 2px solid var(--ink); box-shadow: 4px 4px 0 var(--ink); }
.master-home-art img { display: block; width: 100%; height: 100%; object-fit: cover; }
.master-home-art span { position: absolute; right: .6rem; bottom: .6rem; padding: .3rem .5rem; border: 2px solid var(--ink); background: var(--paper); color: var(--ink); font-size: .68rem; font-weight: 800; }
.master-home-feature h2 { font-size: clamp(1.8rem, 4vw, 3rem); line-height: 1.05; font-weight: 850; }
.master-home-feature > div > p:not(.section-kicker) { max-width: 42ch; color: var(--yellow-foreground); line-height: 1.6; }
.feature-art-link { display: block; min-width: 0; color: inherit; text-decoration: none; }
.feature-art-link:focus-visible { outline: 3px solid var(--coral); outline-offset: 5px; }
.feature-art { position: relative; min-width: 0; aspect-ratio: 1.18; overflow: hidden; border: 2px solid var(--ink); background: var(--yellow); box-shadow: 6px 6px 0 var(--ink); transform: rotate(-.6deg); transition: transform .2s ease; }
.feature-art:hover { transform: rotate(0); }
.feature-art-link:active .feature-art { transform: translate(2px, 2px) rotate(0); box-shadow: 1px 1px 0 var(--ink); }
.feature-art::after { position: absolute; inset: auto 0 0; height: 25%; content: ''; background: linear-gradient(transparent, color-mix(in srgb, var(--ink) 26%, transparent)); pointer-events: none; }
.feature-art img { display: block; width: 100%; height: 100%; object-fit: cover; }
.art-index { position: absolute; z-index: 1; right: .8rem; bottom: .8rem; padding: .45rem .65rem; border: 2px solid var(--ink); background: var(--yellow); color: var(--yellow-foreground); font-size: .74rem; font-weight: 800; letter-spacing: .06em; }
.feature-copy { padding-block: 1rem; }
.feature-copy h1 { font-size: clamp(2.6rem, 5.3vw, 4.35rem); line-height: 1.04; font-weight: 850; }
.feature-copy h1 em { color: var(--blue); font-style: normal; }
.feature-description { max-width: 36ch; margin: 1.3rem 0 1.4rem; color: var(--muted); font-size: 1rem; line-height: 1.7; }
.today-line { display: flex; align-items: center; gap: .55rem; color: var(--muted); font-size: .83rem; font-weight: 600; }
.line-divider { color: var(--line-divider); }
.play-link { display: inline-flex; align-items: center; justify-content: center; gap: 1.5rem; min-height: 3.1rem; margin-top: 1.65rem; padding: 0 1.2rem; border: 2px solid var(--ink); background: var(--blue); color: var(--blue-foreground); box-shadow: var(--shadow); font-size: .87rem; font-weight: 800; text-decoration: none; transition: transform .16s ease, box-shadow .16s ease; }
.play-link:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--ink); }
.leaderboard-home-link { display: block; width: fit-content; margin-top: .9rem; color: var(--blue); font-size: .84rem; font-weight: 750; text-decoration-thickness: 1px; text-underline-offset: .2rem; }
.play-link:focus-visible, .leaderboard-home-link:focus-visible { outline: 3px solid var(--coral); outline-offset: 4px; }
.archive-preview { margin-top: clamp(4rem, 9vw, 7rem); }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1.35rem; }
.section-heading .section-kicker { margin-bottom: .35rem; }
.section-heading h2 { font-size: clamp(1.45rem, 3vw, 2rem); font-weight: 850; }
.archive-all { color: var(--blue); font-weight: 700; }
.archive-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.prototype-note { margin: 1.5rem 0 0; color: var(--muted); font-size: .75rem; }
.play-link:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--ink); }
@media (max-width: 760px) {
  .daily-feature { grid-template-columns: 1fr; gap: 1.4rem; }
  .master-home-feature { grid-template-columns: minmax(0, 1fr); }
  .master-home-art { width: min(100%, 400px); }
  .feature-art { aspect-ratio: 1.22; max-height: 440px; }
  .feature-copy { padding: 0; }
  .feature-copy h1 { font-size: clamp(2.7rem, 11vw, 4rem); }
  .feature-description { margin-block: .9rem 1rem; }
  .archive-preview { margin-top: 3.7rem; }
  .archive-grid { grid-template-columns: 1fr; } }
@media (max-width: 470px) {
  .home-page { padding-inline: 1.1rem; }
  .feature-art { aspect-ratio: 1.05; }
  .section-heading { align-items: start; }
  .archive-all { margin-top: 1rem; font-size: .75rem; white-space: nowrap; } }
</style>
