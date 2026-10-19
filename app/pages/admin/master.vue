<template>
  <main class="page-wrap admin-master-page">
    <NuxtLink class="soft-link" :to="$localePath({ name: 'admin-calendar' })">{{ t('masterAdmin.back') }}</NuxtLink>
    <header class="admin-master-heading">
      <p class="section-kicker">{{ t('masterAdmin.kicker') }}</p>
      <h1>{{ t('masterAdmin.title') }}</h1>
      <p>{{ t('masterAdmin.description') }}</p>
    </header>

    <div class="admin-master-layout">
      <form class="admin-master-form" @submit.prevent="savePuzzle('draft')">
        <label class="admin-master-field">
          {{ t('masterAdmin.week') }}
          <input v-model="weekStart" type="date" required @change="loadWeek">
          <small>{{ weekKey || '—' }} · {{ t('masterAdmin.mondayOnly') }}</small>
        </label>
        <div class="admin-master-field">
          <span>{{ t('masterAdmin.size') }}</span>
          <div class="master-size-options" role="radiogroup" :aria-label="t('masterAdmin.size')">
            <button v-for="size in masterGridSizes" :key="size" type="button" role="radio" :aria-checked="form.gridSize === size" :class="{ selected: form.gridSize === size }" @click="form.gridSize = size">
              <strong>{{ size }} × {{ size }}</strong>
              <span>{{ size * size }} {{ t('masterAdmin.pieces') }}</span>
            </button>
          </div>
        </div>
        <label class="admin-master-field">{{ t('masterAdmin.titleFr') }}
          <input v-model="form.title" maxlength="120" required>
        </label>
        <label class="admin-master-field">{{ t('masterAdmin.noteFr') }}
          <textarea v-model="form.note" rows="2" maxlength="500" />
        </label>
        <details class="admin-master-english">
          <summary>{{ t('masterAdmin.english') }}</summary>
          <label class="admin-master-field">{{ t('masterAdmin.titleEn') }}<input v-model="form.titleEn" maxlength="120"></label>
          <label class="admin-master-field">{{ t('masterAdmin.noteEn') }}<textarea v-model="form.noteEn" rows="2" maxlength="500" /></label>
        </details>
        <div class="admin-master-save-row">
          <p v-if="currentPuzzle" class="admin-master-status" :class="`is-${currentPuzzle.status}`">{{ t(currentPuzzle.status === 'published' ? 'masterAdmin.published' : 'masterAdmin.draft') }}</p>
          <p v-if="message" class="admin-master-message" role="status">{{ message }}</p>
          <p v-if="error" class="admin-master-error" role="alert">{{ error }}</p>
          <button class="play-link" type="submit" :disabled="saving || !form.imageSlug">{{ saving ? t('masterAdmin.saving') : t('masterAdmin.saveDraft') }}</button>
          <button class="master-publish-button" type="button" :disabled="saving || !form.imageSlug" @click="savePuzzle('published')">{{ t('masterAdmin.publish') }}</button>
        </div>
      </form>

      <aside class="master-art-picker" aria-labelledby="master-art-title">
        <h2 id="master-art-title">{{ t('masterAdmin.chooseArt') }}</h2>
        <label class="admin-master-field">{{ t('masterAdmin.searchArt') }}
          <input v-model="search" type="search" :placeholder="t('masterAdmin.searchPlaceholder')">
        </label>
        <p v-if="artError" class="admin-master-error" role="alert">{{ artError }}</p>
        <div class="master-art-grid">
          <button v-for="illustration in visibleIllustrations" :key="illustration.slug" type="button" class="master-art-option" :class="{ selected: illustration.slug === form.imageSlug }" :aria-pressed="illustration.slug === form.imageSlug" @click="selectIllustration(illustration)">
            <img :src="illustration.url" :alt="illustration.name" loading="lazy">
            <span>{{ illustration.name }}</span>
          </button>
        </div>
        <button v-if="canLoadMore" class="admin-secondary master-load-more" type="button" :disabled="artLoading" @click="loadIllustrations">
          {{ artLoading ? t('masterAdmin.loadingArt') : t('masterAdmin.loadMore') }}
        </button>
        <p v-if="!visibleIllustrations.length && !artLoading" class="empty-state">{{ t('masterAdmin.noArt') }}</p>
      </aside>
    </div>

    <section v-if="puzzles.length" class="master-admin-existing">
      <h2>{{ t('masterAdmin.scheduled') }}</h2>
      <button v-for="puzzle in puzzles" :key="puzzle.puzzleId" type="button" class="master-scheduled-row" @click="editPuzzle(puzzle)">
        <img :src="puzzle.imageUrl" alt="" loading="lazy">
        <span><strong>{{ puzzle.weekKey }} · {{ puzzle.title }}</strong><small>{{ puzzle.pieceCount }} {{ t('masterAdmin.pieces') }} · {{ t(puzzle.status === 'published' ? 'masterAdmin.published' : 'masterAdmin.draft') }}</small></span>
        <span aria-hidden="true">↗</span>
      </button>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { WeeklyPuzzle, PuzzleStatus } from '#shared/types/puzzle'
import { getIsoWeekKeyForDate } from '#shared/utils/iso-week'
import { MASTER_GRID_SIZES, type MasterGridSize } from '#shared/utils/master-config'

definePageMeta({ name: 'admin-master', middleware: 'admin' })
const { $t } = useI18n()
const t = (key: string): string => String($t(key as any) ?? '')
const { $defineI18nRoute, $localePath } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/admin/master' } })

interface Illustration { name: string; slug: string; url: string; description: string }
interface FormState {
  title: string; note: string; titleEn: string; noteEn: string
  imageName: string; imageSlug: string; imageUrl: string; imageDescription: string; gridSize: MasterGridSize
}

const weekStart = ref(mondayOf(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date())))
const weekKey = computed(() => { try { return getIsoWeekKeyForDate(weekStart.value) } catch { return '' } })
const form = reactive<FormState>(emptyForm())
const masterGridSizes = MASTER_GRID_SIZES
const puzzles = ref<WeeklyPuzzle[]>([])
const illustrations = ref<Illustration[]>([])
const search = ref('')
const nextOffset = ref(0)
const total = ref(0)
const artLoading = ref(false)
const artError = ref('')
const error = ref('')
const message = ref('')
const saving = ref(false)
const currentPuzzle = computed(() => puzzles.value.find(puzzle => puzzle.weekKey === weekKey.value))
const filteredIllustrations = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  return illustrations.value.filter(image => !query || image.name.toLocaleLowerCase().includes(query) || image.slug.toLowerCase().includes(query))
})
const visibleIllustrations = computed(() => filteredIllustrations.value.slice(0, 36))
const canLoadMore = computed(() => nextOffset.value < total.value)

onMounted(async () => {
  await Promise.all([loadPuzzles(), loadIllustrations()])
  loadWeek()
})

function emptyForm(): FormState {
  return { title: '', note: '', titleEn: '', noteEn: '', imageName: '', imageSlug: '', imageUrl: '', imageDescription: '', gridSize: 16 }
}

function mondayOf(date: string) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7))
  return value.toISOString().slice(0, 10)
}

async function loadPuzzles() {
  try { puzzles.value = await $fetch<WeeklyPuzzle[]>('/api/admin/weekly-puzzles') } catch { error.value = t('masterAdmin.loadError') }
}

async function loadWeek() {
  weekStart.value = mondayOf(weekStart.value)
  const existing = puzzles.value.find(puzzle => puzzle.weekKey === weekKey.value)
  Object.assign(form, existing ? {
    title: existing.title, note: existing.note, titleEn: existing.titleEn, noteEn: existing.noteEn,
    imageName: existing.imageName, imageSlug: existing.imageSlug, imageUrl: existing.imageUrl,
    imageDescription: existing.imageDescription, gridSize: existing.gridRows === 20 ? 20 : 16,
  } : emptyForm())
  if (existing && !illustrations.value.some(image => image.slug === existing.imageSlug)) {
    illustrations.value.unshift({ name: existing.imageName, slug: existing.imageSlug, url: existing.imageUrl, description: existing.imageDescription })
  }
  error.value = ''
  message.value = ''
}

async function loadIllustrations() {
  if (artLoading.value || !canLoadMore.value && illustrations.value.length) return
  artLoading.value = true
  artError.value = ''
  try {
    const result = await $fetch<{ items: Illustration[]; nextOffset: number; total: number }>('/api/admin/illustrations', { query: { limit: 48, offset: nextOffset.value } })
    illustrations.value.push(...result.items)
    nextOffset.value = result.nextOffset
    total.value = result.total
  } catch { artError.value = t('masterAdmin.artError') }
  finally { artLoading.value = false }
}

function selectIllustration(illustration: Illustration) {
  form.imageName = illustration.name
  form.imageSlug = illustration.slug
  form.imageUrl = illustration.url
  form.imageDescription = illustration.description
  if (!form.title) form.title = illustration.name
}

async function savePuzzle(status: PuzzleStatus) {
  error.value = ''
  message.value = ''
  if (!weekKey.value) { error.value = t('masterAdmin.invalidWeek'); return }
  if (form.imageUrl) {
    try {
      const image = new Image()
      image.src = form.imageUrl
      await image.decode()
      if (Math.abs(image.naturalWidth - image.naturalHeight) > 1) throw new Error(t('masterAdmin.squareRequired'))
    } catch (cause: any) {
      error.value = cause?.message || t('masterAdmin.imageLoadError')
      return
    }
  }
  saving.value = true
  try {
    await $fetch('/api/admin/weekly-puzzles', {
      method: 'POST',
      body: { weekKey: weekKey.value, ...form, status },
    })
    await loadPuzzles()
    message.value = t(status === 'published' ? 'masterAdmin.publishSuccess' : 'masterAdmin.draftSuccess')
  } catch (cause: any) {
    error.value = cause?.data?.statusMessage || t('masterAdmin.saveError')
  } finally { saving.value = false }
}

function editPuzzle(puzzle: WeeklyPuzzle) {
  weekStart.value = puzzle.weekStart
  loadWeek()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style>
.admin-master-page { flex: 1; padding-block: 2.5rem 5rem; }
.admin-master-heading { max-width: 42rem; margin-block: 2rem; }
.admin-master-heading h1 { margin: .45rem 0; font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1; font-weight: 850; }
.admin-master-heading > p:last-child { color: var(--muted); line-height: 1.6; }
.admin-master-layout { display: grid; grid-template-columns: minmax(0, .9fr) minmax(20rem, 1.1fr); gap: clamp(1.25rem, 4vw, 3rem); align-items: start; }
.admin-master-form, .master-art-picker { display: grid; gap: 1.1rem; min-width: 0; }
.admin-master-field { display: grid; gap: .45rem; color: var(--ink); font-size: .84rem; font-weight: 750; }
.admin-master-field small { color: var(--muted); font-weight: 550; }
.admin-master-field input, .admin-master-field textarea { width: 100%; min-width: 0; border: 2px solid var(--ink); border-radius: 0; padding: .72rem .8rem; background: var(--white); color: var(--ink); font: inherit; font-weight: 550; }
.admin-master-field input:focus-visible, .admin-master-field textarea:focus-visible { outline: 3px solid var(--coral); outline-offset: 2px; }
.master-size-options { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: .7rem; }
.master-size-options button { display: grid; gap: .3rem; justify-items: start; padding: .9rem; border: 2px solid var(--ink); background: var(--white); color: var(--ink); text-align: left; cursor: pointer; }
.master-size-options button.selected { background: var(--yellow); box-shadow: 3px 3px 0 var(--ink); }
.master-size-options button span { color: var(--muted); font-size: .74rem; }
.admin-master-english { display: grid; gap: 1rem; }
.admin-master-english summary { width: fit-content; color: var(--blue); font-size: .84rem; font-weight: 750; cursor: pointer; }
.admin-master-english[open] { padding-top: .6rem; }
.admin-master-save-row { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; padding-top: .7rem; }
.admin-master-save-row .play-link { margin: 0; }
.master-publish-button, .admin-secondary { min-height: 3rem; border: 2px solid var(--ink); padding: 0 1rem; background: var(--yellow); color: var(--ink); box-shadow: var(--shadow); font: inherit; font-size: .84rem; font-weight: 800; cursor: pointer; }
.master-publish-button:disabled, .admin-master-save-row .play-link:disabled { opacity: .55; cursor: not-allowed; }
.admin-master-status, .admin-master-message, .admin-master-error { flex-basis: 100%; margin: 0; font-size: .82rem; }
.admin-master-status { color: var(--muted); font-weight: 750; }
.admin-master-status.is-published { color: var(--blue); }
.admin-master-message { color: var(--blue); }
.admin-master-error { color: var(--coral); }
.master-art-picker { padding: 1rem; border: 2px solid var(--ink); background: color-mix(in srgb, var(--white) 55%, transparent); }
.master-art-picker h2, .master-admin-existing h2 { font-size: 1.15rem; font-weight: 850; }
.master-art-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: .65rem; max-height: 38rem; overflow: auto; padding: .2rem .2rem .5rem; }
.master-art-option { display: grid; gap: .35rem; padding: .35rem; border: 2px solid transparent; background: var(--white); color: var(--ink); text-align: left; cursor: pointer; }
.master-art-option.selected { border-color: var(--blue); box-shadow: 2px 2px 0 var(--ink); }
.master-art-option:focus-visible, .master-scheduled-row:focus-visible { outline: 3px solid var(--coral); outline-offset: 2px; }
.master-art-option img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; background: var(--yellow); }
.master-art-option span { overflow: hidden; font-size: .7rem; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
.master-load-more { width: fit-content; justify-self: center; cursor: pointer; }
.master-admin-existing { display: grid; gap: .75rem; margin-top: 3rem; }
.master-scheduled-row { display: flex; width: 100%; align-items: center; gap: .8rem; padding: .65rem; border: 2px solid var(--ink); background: var(--white); color: var(--ink); text-align: left; cursor: pointer; }
.master-scheduled-row img { width: 3rem; aspect-ratio: 1; object-fit: cover; }
.master-scheduled-row > span:nth-child(2) { display: grid; gap: .2rem; flex: 1; }
.master-scheduled-row strong { font-size: .84rem; }
.master-scheduled-row small { color: var(--muted); font-size: .72rem; }
@media (max-width: 760px) { .admin-master-layout { grid-template-columns: 1fr; } .master-art-grid { grid-template-columns: repeat(3, minmax(0,1fr)); max-height: 28rem; } }
@media (max-width: 420px) { .master-art-picker { padding: .7rem; } .master-art-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
</style>
