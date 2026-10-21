<template>
  <main class="admin-page" :class="{ 'is-fullscreen': fullscreen }">
    <div class="admin-topline">
      <div>
        <NuxtLink class="auth-back" :to="$localePath({ name: 'index' })">{{ t('admin.back') }}</NuxtLink>
        <h1>{{ t('admin.calendarTitle') }}</h1>
      </div>
      <div class="admin-actions">
        <NuxtLink class="admin-secondary admin-metrics-link" :to="$localePath({ name: 'admin-metrics' })">{{ t('admin.metricsLink') }}</NuxtLink>
        <button class="admin-secondary" @click="toggleFullscreen">{{ fullscreen ? t('admin.exitFullscreen') : t('admin.fullscreen') }}</button>
        <button class="admin-primary admin-add" @click="openNew()">{{ t('admin.newPuzzle') }}</button>
      </div>
    </div>

    <div class="calendar-legend">
      <span><i class="legend-published" />{{ t('admin.published') }}</span>
      <span><i class="legend-draft" />{{ t('admin.draft') }}</span>
    </div>

    <div v-if="error" class="admin-alert" role="alert">{{ error }}</div>
    <div v-if="notice" class="admin-notice" role="status">{{ notice }}</div>
    <div v-if="loading" class="page-loading-state page-loading-state--calendar" aria-busy="true"><BrandLoader :label="t('admin.loading')" /></div>
    <ClientOnly v-else>
      <div class="calendar-frame" @pointerover="handleCalendarPointerOver" @pointerout="handleCalendarPointerOut" @focusin="handleCalendarFocusIn" @focusout="handleCalendarFocusOut">
        <DayFlowCalendar v-if="calendarApp" :calendar="calendarApp" />
      </div>
      <template #fallback><div class="page-loading-state page-loading-state--calendar" aria-busy="true"><BrandLoader :label="t('admin.loading')" /></div></template>
    </ClientOnly>

    <NTooltip v-model:open="previewOpen" :delay-duration="0" :_tooltip-content="{ class: 'calendar-event-tooltip' }">
      <span class="calendar-tooltip-anchor" :style="previewAnchorStyle" aria-hidden="true" />
      <template #content>
        <div v-if="previewPuzzle" class="calendar-event-preview" @pointerenter="keepCalendarPreviewOpen" @pointerleave="scheduleCalendarPreviewClose" @focusin="keepCalendarPreviewOpen" @focusout="handlePreviewFocusOut">
          <img :src="previewPuzzle.imageUrl" :alt="previewPuzzle.imageName">
          <div>
            <div class="calendar-event-title-row">
              <strong>{{ displayTitle(previewPuzzle) }}</strong>
              <button type="button" class="calendar-preview-edit" :aria-label="t('admin.editPuzzleIllustration')" :title="t('admin.editPuzzleIllustration')" @click.stop="openIllustrationEditor(previewPuzzle)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 4 4M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z" /></svg>
              </button>
            </div>
            <span>{{ formatPuzzleDate(previewPuzzle.date, { day: 'numeric', month: 'long' }, $getLocale() === 'en' ? 'en-US' : 'fr-FR') }}</span>
            <span>{{ t('admin.eventDescription', { count: previewPuzzle.pieceCount, image: previewPuzzle.imageName }) }}</span>
          </div>
        </div>
      </template>
    </NTooltip>

    <NTabs v-model="editorTab" class="editor-tabs" :unmount-on-hide="false">
    <NDialog
      v-model:open="dialogOpen"
      :title="editingDate ? t('admin.editPuzzle') : t('admin.preparePuzzle')"
      :description="t('admin.dialogDescription')"
      scrollable
      :_dialog-overlay="{ class: 'puzzle-dialog-overlay' }"
      :_dialog-content="{ class: 'puzzle-dialog' }"
      :_dialog-header="{ class: 'puzzle-dialog-header' }"
      :_dialog-footer="{ class: 'puzzle-dialog-footer' }"
    >
      <template #header>
        <div class="puzzle-dialog-heading">
          <div class="puzzle-dialog-title-block">
            <NDialogTitle class="puzzle-dialog-title">{{ editingDate ? t('admin.editPuzzle') : t('admin.preparePuzzle') }}</NDialogTitle>
            <NDialogDescription class="puzzle-dialog-description">{{ t('admin.dialogDescription') }}</NDialogDescription>
          </div>
          <button v-if="form.imageUrl" type="button" class="dialog-art-preview" :aria-label="t('admin.editPuzzleIllustration')" :title="t('admin.editPuzzleIllustration')" @click="openIllustrationPicker">
            <img :src="form.imageUrl" :alt="form.imageName">
            <span>{{ form.imageName }}</span>
          </button>
        </div>
        <div class="editor-tabs-header">
          <NTabsList class="editor-tabs-list" :aria-label="t('admin.steps')">
            <NTabsTrigger value="illustration" class="editor-tab-trigger">
              <span>{{ t('admin.illustration') }}</span>
              <span v-if="form.imageSlug" class="editor-tab-check" :aria-label="t('admin.illustrationSelected')">✓</span>
            </NTabsTrigger>
            <NTabsTrigger value="details" class="editor-tab-trigger">{{ t('admin.details') }}</NTabsTrigger>
          </NTabsList>
        </div>
      </template>
      <form id="puzzle-editor-form" class="puzzle-form" @submit.prevent="savePuzzle">
        <div ref="panelStage" class="dialog-panel-stage">
          <NTabsContent v-if="editorTab === 'illustration'" value="illustration" class="editor-tab-panel">
            <div v-if="form.imageUrl && !choosingIllustration" class="selected-illustration is-compact">
              <img :src="form.imageUrl" :alt="form.imageName">
              <div><span>{{ t('admin.selectedIllustration') }}</span><strong>{{ form.imageName }}</strong></div>
              <button type="button" class="admin-secondary change-illustration" @click="choosingIllustration = true">{{ t('admin.chooseAnother') }}</button>
            </div>
            <template v-if="!form.imageUrl || choosingIllustration">
              <label for="illustration-search">{{ t('admin.searchIllustrations') }}</label>
              <input id="illustration-search" ref="illustrationSearchInput" v-model="illustrationSearch" type="search" :placeholder="t('admin.searchPlaceholder')" @keydown.down.prevent="focusIllustrationTabStop">
              <p class="illustration-keyboard-hint">{{ t('admin.illustrationKeyboardHint') }}</p>
              <div class="illustration-results" role="group" :aria-busy="illustrationsLoading" :aria-label="t('admin.illustrationChoices')" @keydown="handleIllustrationGridKeydown">
                <button
                  v-for="image in filteredIllustrations"
                  :key="image.slug"
                  type="button"
                  class="illustration-option"
                  :class="{ selected: form.imageSlug === image.slug }"
                  :tabindex="image.slug === illustrationTabStopSlug ? 0 : -1"
                  :aria-pressed="form.imageSlug === image.slug"
                  @focus="focusedIllustrationSlug = image.slug"
                  @click="selectIllustration(image)"
                >
                  <img :src="image.url" :alt="image.name" loading="lazy">
                  <span>{{ image.name }}</span>
                </button>
                <p v-if="!filteredIllustrations.length && !illustrationsLoading" class="empty-illustrations">{{ t('admin.noIllustrations') }}</p>
                <p v-if="illustrationsLoading" class="illustration-loading" role="status">{{ t('admin.loading') }}</p>
                <div ref="illustrationSentinel" class="illustration-sentinel" aria-hidden="true" />
              </div>
            </template>
            <button class="editor-continue" type="button" :disabled="!form.imageSlug" @click="editorTab = 'details'">{{ t('admin.continue') }} <span aria-hidden="true">→</span></button>
          </NTabsContent>

          <NTabsContent v-else value="details" class="editor-tab-panel" key="details">
            <div class="puzzle-details-grid">
              <label class="detail-meta-field">{{ t('admin.date') }}<input v-model="form.date" type="date" required></label>
              <label class="detail-meta-field">{{ t('admin.pieceCount') }}
                <NCombobox
                  v-model="selectedGridSizeOption"
                  class="daily-grid-size-combobox"
                  :items="gridSizeOptions"
                  label-key="label"
                  value-key="value"
                  :text-empty="t('admin.noDifficultyResults')"
                  :_combobox-trigger="{ class: 'daily-grid-size-trigger', btn: 'solid-white', block: true, ariaLabel: t('admin.pieceCount'), trailing: 'i-lucide-chevron-down' }"
                  :_combobox-input="{ class: 'daily-grid-size-search', placeholder: t('admin.searchDifficulty'), 'aria-label': t('admin.searchDifficulty') }"
                  :_combobox-list="{ class: 'daily-grid-size-list' }"
                >
                  <template #trigger>
                    <span>{{ selectedGridSizeOption?.label }}</span>
                  </template>
                </NCombobox>
              </label>
              <label class="detail-text-field">{{ t('admin.title') }}
                <span class="field-control-row">
                  <input v-if="titleLanguage === 'fr'" v-model="form.title" maxlength="120" required>
                  <input v-else v-model="form.titleEn" maxlength="120" :placeholder="form.title">
                  <NTabs v-model="titleLanguage" class="field-language-tabs">
                    <NTabsList class="field-language-list" :aria-label="t('admin.title')">
                      <NTabsTrigger value="fr" class="field-language-trigger">FR</NTabsTrigger>
                      <NTabsTrigger value="en" class="field-language-trigger">EN</NTabsTrigger>
                    </NTabsList>
                  </NTabs>
                </span>
              </label>
              <label class="detail-text-field puzzle-note-field">{{ t('admin.note') }}
                <span class="field-control-row field-control-row-note">
                  <textarea v-if="noteLanguage === 'fr'" v-model="form.note" rows="3" maxlength="500" :placeholder="t('admin.notePlaceholder')" />
                  <textarea v-else v-model="form.noteEn" rows="3" maxlength="500" :placeholder="form.note || t('admin.notePlaceholder')" />
                  <NTabs v-model="noteLanguage" class="field-language-tabs">
                    <NTabsList class="field-language-list" :aria-label="t('admin.note')">
                      <NTabsTrigger value="fr" class="field-language-trigger">FR</NTabsTrigger>
                      <NTabsTrigger value="en" class="field-language-trigger">EN</NTabsTrigger>
                    </NTabsList>
                  </NTabs>
                </span>
              </label>
              <p class="english-optional">{{ t('admin.englishOptional') }}</p>
              <p v-if="draftSaveState === 'saving' || draftSaveState === 'saved'" class="draft-autosave" role="status">{{ draftSaveState === 'saving' ? t('admin.autosaving') : t('admin.autosaved') }}</p>
            </div>
          </NTabsContent>
        </div>
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      </form>
      <template #footer>
        <div class="dialog-actions">
          <button v-if="hasDraft" type="button" class="admin-delete" :disabled="saving" @click="deletePuzzle">{{ t('admin.deleteDraft') }}</button>
          <button v-if="form.imageSlug" type="button" class="admin-secondary" :disabled="saving || draftSaveState === 'saving' || draftSaveState === 'error'" @click="openPuzzlePreview">{{ t('admin.playPreview') }}</button>
          <button type="button" class="admin-cancel" :disabled="saving" @click="dialogOpen = false">{{ t('admin.cancel') }}</button>
          <button type="submit" form="puzzle-editor-form" class="admin-primary" :disabled="saving || !form.imageSlug">
            {{ saving ? t('admin.saving') : t('admin.publish') }}
          </button>
        </div>
      </template>
    </NDialog>
    </NTabs>
  </main>
</template>

<script setup lang="ts">
import { Temporal } from 'temporal-polyfill'
import type { CalendarType, Event, UseCalendarAppReturn } from '@dayflow/vue'
import { createDayView, createMonthView, createWeekView, createYearView, DayFlowCalendar, useCalendarApp } from '@dayflow/vue'
import type { DailyPuzzle } from '#shared/types/puzzle'
import { formatPuzzleDate } from '#shared/types/puzzle'
import { DAILY_PUZZLE_GRID_SIZES, isDailyPuzzleGridSize } from '#shared/utils/puzzle-attempt'

definePageMeta({ name: 'admin-calendar', middleware: 'admin' })
const { $getLocale, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const { $defineI18nRoute, $localePath } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/admin/calendar' } })

interface Illustration { name: string; slug: string; url: string; description: string }
interface PuzzleForm {
  date: string
  title: string
  note: string
  titleEn: string
  noteEn: string
  imageName: string
  imageSlug: string
  imageUrl: string
  imageDescription: string
  gridSize: number
  status: 'draft' | 'published'
}
interface GridSizeOption { value: number; label: string }

const calendarApp = shallowRef<UseCalendarAppReturn>()
const allPuzzles = ref<DailyPuzzle[]>([])
const loading = ref(true)
const error = ref('')
const notice = ref('')
const fullscreen = ref(false)
const dialogOpen = ref(false)
const editorTab = ref<'illustration' | 'details'>('illustration')
const editingDate = ref('')
const sourceDate = ref('')
const titleLanguage = ref<'fr' | 'en'>('fr')
const noteLanguage = ref<'fr' | 'en'>('fr')
const choosingIllustration = ref(false)
const hasDraft = ref(false)
const draftSaveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const saving = ref(false)
const formError = ref('')
const illustrationSearch = ref('')
const illustrations = ref<Illustration[]>([])
const illustrationsOffset = ref(0)
const illustrationTotal = ref(0)
const illustrationsLoading = ref(false)
const illustrationSentinel = ref<HTMLElement>()
const illustrationSearchInput = ref<HTMLInputElement>()
const focusedIllustrationSlug = ref('')
const previewPuzzle = shallowRef<DailyPuzzle>()
const previewOpen = ref(false)
const previewAnchor = reactive({ x: 0, y: 0 })
const previewAnchorStyle = computed(() => ({ left: `${previewAnchor.x}px`, top: `${previewAnchor.y}px` }))
const panelStage = ref<HTMLElement>()
const form = reactive<PuzzleForm>(emptyForm())
const gridSizeDifficultyKeys: Record<number, string> = {
  3: 'admin.easy',
  4: 'admin.balanced',
  5: 'admin.challenging',
  6: 'admin.hard',
  7: 'admin.veryHard',
  8: 'admin.expert',
}
const gridSizeOptions = computed<GridSizeOption[]>(() => DAILY_PUZZLE_GRID_SIZES.map((size) => ({
  value: size,
  label: t(gridSizeDifficultyKeys[size]!, { count: size * size }),
})))
const selectedGridSizeOption = computed<GridSizeOption | null>({
  get: () => gridSizeOptions.value.find(option => option.value === form.gridSize) ?? gridSizeOptions.value[0] ?? null,
  set: (option) => {
    if (option && isDailyPuzzleGridSize(option.value)) form.gridSize = option.value
  },
})
let autosaveTimer: ReturnType<typeof setTimeout> | undefined
let previewCloseTimer: ReturnType<typeof setTimeout> | undefined
let panelHeightTimer: ReturnType<typeof setTimeout> | undefined
let illustrationObserver: IntersectionObserver | undefined
let formReady = false
let autosaveRunning = false
let autosaveAgain = false
const filteredIllustrations = computed(() => {
  const query = illustrationSearch.value.trim().toLocaleLowerCase($getLocale())
  return illustrations.value.filter(image => !query || image.name.toLocaleLowerCase($getLocale()).includes(query) || image.slug.toLowerCase().includes(query))
})
const illustrationTabStopSlug = computed(() => {
  const visible = filteredIllustrations.value
  return visible.find(image => image.slug === focusedIllustrationSlug.value)?.slug
    ?? visible.find(image => image.slug === form.imageSlug)?.slug
    ?? visible[0]?.slug
    ?? ''
})
const calendars: CalendarType[] = [
  { id: 'published', name: t('admin.published'), colors: { eventColor: '#254be8', eventSelectedColor: '#1738bd', lineColor: '#1839bd', textColor: '#fff' } },
  { id: 'draft', name: t('admin.draft'), colors: { eventColor: '#ed6554', eventSelectedColor: '#cc493d', lineColor: '#c84c40', textColor: '#fff' } },
]

onMounted(async () => {
  await loadPuzzles()
  await loadIllustrations()
})

function emptyForm(date = todayDate()): PuzzleForm {
  return { date, title: '', note: '', titleEn: '', noteEn: '', imageName: '', imageSlug: '', imageUrl: '', imageDescription: '', gridSize: 3, status: 'draft' }
}

function todayDate() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date())
}

function toCalendarEvent(puzzle: DailyPuzzle): Event {
  const start = Temporal.PlainDate.from(puzzle.date)
  return {
    id: puzzle.date,
    title: puzzle.title,
    description: t('admin.eventDescription', { count: puzzle.pieceCount, image: puzzle.imageName }),
    start,
    end: start,
    allDay: true,
    calendarId: puzzle.status,
    meta: { ...puzzle },
  }
}

async function loadPuzzles() {
  loading.value = true
  error.value = ''
  try {
    allPuzzles.value = await $fetch<DailyPuzzle[]>('/api/admin/puzzles')
    calendarApp.value = useCalendarApp({
      views: [
        createMonthView({ label: t('admin.month'), startOfWeek: 1, gridDateClick: (date) => openNew(formatDate(date)) }),
        createWeekView({ label: t('admin.week'), startOfWeek: 1 }),
        createDayView({ label: t('admin.day') }),
        createYearView({ label: t('admin.year'), mode: 'year-canvas' }),
      ],
      events: allPuzzles.value.map(toCalendarEvent),
      calendars,
      defaultCalendar: 'published',
      defaultView: 'month',
      initialDate: new Date(`${todayDate()}T12:00:00+02:00`),
      useEventDetailDialog: false,
      useEventDetailPanel: false,
      locale: {
        code: $getLocale() === 'en' ? 'en-US' : 'fr-FR',
        messages: {
          allDay: t('admin.allDay'),
          noEvents: t('admin.noEvents'),
          today: t('admin.today'),
          day: t('admin.day'),
          week: t('admin.week'),
          month: t('admin.month'),
          year: t('admin.year'),
          search: t('admin.search'),
          createCalendar: t('admin.createCalendar'),
        },
      },
      timeZone: 'Europe/Paris',
      useCalendarHeader: true,
      callbacks: {
        onEventClick: (event) => openEdit(String(event.id)),
        onEventUpdate: handleEventMove,
      },
    })
  } catch (cause: any) {
    error.value = t('admin.calendarError')
  } finally {
    loading.value = false
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(date)
}

function openNew(date = todayDate()) {
  formReady = false
  previewOpen.value = false
  editingDate.value = ''
  sourceDate.value = ''
  hasDraft.value = false
  draftSaveState.value = 'idle'
  Object.assign(form, emptyForm(date))
  formError.value = ''
  editorTab.value = 'illustration'
  titleLanguage.value = 'fr'
  noteLanguage.value = 'fr'
  choosingIllustration.value = true
  illustrationSearch.value = ''
  dialogOpen.value = true
  nextTick(() => { formReady = true })
}

function openEdit(date: string) {
  const puzzle = allPuzzles.value.find(item => item.date === date)
  if (!puzzle) return openNew(date)
  formReady = false
  previewOpen.value = false
  editingDate.value = puzzle.date
  sourceDate.value = puzzle.status === 'published' ? puzzle.date : (puzzle as DailyPuzzle & { sourceDate?: string }).sourceDate || ''
  hasDraft.value = puzzle.status === 'draft'
  draftSaveState.value = hasDraft.value ? 'saved' : 'idle'
  Object.assign(form, {
    date: puzzle.date,
    title: puzzle.title,
    note: puzzle.note,
    titleEn: puzzle.titleEn,
    noteEn: puzzle.noteEn,
    imageName: puzzle.imageName,
    imageSlug: puzzle.imageSlug,
    imageUrl: puzzle.imageUrl,
    imageDescription: puzzle.imageDescription ?? '',
    gridSize: puzzle.gridSize,
    status: 'draft',
  })
  formError.value = ''
  editorTab.value = 'details'
  titleLanguage.value = 'fr'
  noteLanguage.value = 'fr'
  choosingIllustration.value = false
  illustrationSearch.value = ''
  dialogOpen.value = true
  nextTick(() => { formReady = true })
}

async function loadIllustrations(reset = false) {
  if (illustrationsLoading.value) return
  illustrationsLoading.value = true
  try {
    const offset = reset ? 0 : illustrationsOffset.value
    const result = await $fetch<{ items: Illustration[]; total: number; nextOffset: number }>('/api/admin/illustrations', { query: { limit: 100, offset } })
    illustrations.value = reset ? result.items : [...illustrations.value, ...result.items]
    illustrationsOffset.value = result.nextOffset
    illustrationTotal.value = result.total
  } catch (cause: any) {
    error.value = t('admin.illustrationsUnavailable')
  } finally {
    illustrationsLoading.value = false
  }
}

function selectIllustration(image: Illustration) {
  form.imageName = image.name
  form.imageSlug = image.slug
  form.imageUrl = image.url
  form.imageDescription = image.description
  choosingIllustration.value = false
  if (!form.title) form.title = image.name
}

function focusIllustrationSearch() {
  void nextTick(() => requestAnimationFrame(() => illustrationSearchInput.value?.focus()))
}

function openIllustrationPicker() {
  editorTab.value = 'illustration'
  choosingIllustration.value = true
  illustrationSearch.value = ''
  focusedIllustrationSlug.value = form.imageSlug
  focusIllustrationSearch()
}

function openIllustrationEditor(puzzle: DailyPuzzle) {
  openEdit(puzzle.date)
  openIllustrationPicker()
  previewOpen.value = false
}

async function openPuzzlePreview() {
  if (!form.imageSlug || saving.value || draftSaveState.value === 'saving' || draftSaveState.value === 'error') return
  if (!editingDate.value && !hasDraft.value) return
  const date = form.date
  dialogOpen.value = false
  await navigateTo($localePath({ name: 'admin-preview', params: { date } }))
}

function focusIllustrationTabStop() {
  const grid = illustrationSearchInput.value?.parentElement?.querySelector<HTMLElement>('.illustration-results')
  const first = grid?.querySelector<HTMLButtonElement>('.illustration-option[tabindex="0"]')
    ?? grid?.querySelector<HTMLButtonElement>('.illustration-option')
  first?.focus()
}

function handleIllustrationGridKeydown(event: KeyboardEvent) {
  const target = event.target
  if (!(target instanceof HTMLButtonElement) || !target.matches('.illustration-option')) return
  if (!event.isComposing && !event.altKey && !event.ctrlKey && !event.metaKey && event.key.length === 1 && event.key !== ' ') {
    const input = illustrationSearchInput.value
    if (!input) return
    event.preventDefault()
    const start = input.selectionStart ?? input.value.length
    const end = input.selectionEnd ?? start
    const nextValue = `${input.value.slice(0, start)}${event.key}${input.value.slice(end)}`
    const nextCursor = start + event.key.length
    focusedIllustrationSlug.value = ''
    illustrationSearch.value = nextValue
    void nextTick(() => {
      input.focus()
      input.setSelectionRange(nextCursor, nextCursor)
    })
    return
  }
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
  const grid = target.closest<HTMLElement>('.illustration-results')
  if (!grid) return
  const options = [...grid.querySelectorAll<HTMLButtonElement>('.illustration-option')]
  const index = options.indexOf(target)
  if (index < 0) return
  const columns = Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').length)
  const rowStart = Math.floor(index / columns) * columns
  const lastIndex = options.length - 1
  const rowCount = Math.ceil(options.length / columns)
  let nextIndex = index
  if (event.key === 'ArrowLeft') nextIndex = index > 0 ? index - 1 : lastIndex
  if (event.key === 'ArrowRight') nextIndex = index < lastIndex ? index + 1 : 0
  if (event.key === 'ArrowUp') {
    const column = index % columns
    const row = Math.floor(index / columns)
    const targetRow = (row - 1 + rowCount) % rowCount
    nextIndex = Math.min(targetRow * columns + column, lastIndex)
  }
  if (event.key === 'ArrowDown') {
    const column = index % columns
    const row = Math.floor(index / columns)
    const targetRow = (row + 1) % rowCount
    nextIndex = Math.min(targetRow * columns + column, lastIndex)
  }
  if (event.key === 'Home') nextIndex = rowStart
  if (event.key === 'End') nextIndex = Math.min(rowStart + columns - 1, lastIndex)
  event.preventDefault()
  if (nextIndex === index) return
  const nextOption = options[nextIndex]
  nextOption?.focus({ preventScroll: true })
  if (!nextOption) return

  const gridBounds = grid.getBoundingClientRect()
  const optionBounds = nextOption.getBoundingClientRect()
  const visibleTop = gridBounds.top + grid.clientTop
  const visibleBottom = visibleTop + grid.clientHeight
  let nextScrollTop = grid.scrollTop
  if (optionBounds.top < visibleTop) nextScrollTop -= visibleTop - optionBounds.top
  else if (optionBounds.bottom > visibleBottom) nextScrollTop += optionBounds.bottom - visibleBottom
  if (nextScrollTop !== grid.scrollTop) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    grid.scrollTo({
      top: nextScrollTop,
      behavior: reduceMotion || event.repeat ? 'auto' : 'smooth',
    })
  }
}

function displayTitle(puzzle: DailyPuzzle) {
  return $getLocale() === 'en' && puzzle.titleEn ? puzzle.titleEn : puzzle.title
}

function calendarPuzzleFromTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return null
  const eventElement = target.closest<HTMLElement>('.df-event')
  if (!eventElement) return null
  eventElement.removeAttribute('title')
  const id = eventElement.dataset.eventId
    || eventElement.closest<HTMLElement>('[data-event-id]')?.dataset.eventId
  const title = eventElement.querySelector('.df-event-title, .df-month-segment-event-title, .df-year-event-title')?.textContent?.trim()
  return allPuzzles.value.find(puzzle => puzzle.date === id)
    || allPuzzles.value.find(puzzle => puzzle.title === title || puzzle.titleEn === title)
    || null
}

function showCalendarPreview(target: EventTarget | null, x?: number, y?: number) {
  const puzzle = calendarPuzzleFromTarget(target)
  if (!puzzle) return
  if (previewCloseTimer) clearTimeout(previewCloseTimer)
  previewPuzzle.value = puzzle
  if (x !== undefined && y !== undefined) {
    previewAnchor.x = x
    previewAnchor.y = y
  } else if (target instanceof Element) {
    const bounds = target.closest<HTMLElement>('.df-event')?.getBoundingClientRect()
    if (bounds) {
      previewAnchor.x = bounds.left + bounds.width / 2
      previewAnchor.y = bounds.top
    }
  }
  previewOpen.value = true
}

function handleCalendarPointerOver(event: PointerEvent) {
  if (event.pointerType === 'touch') return
  showCalendarPreview(event.target, event.clientX, event.clientY)
}

function handleCalendarPointerOut(event: PointerEvent) {
  if (event.relatedTarget instanceof Element && event.relatedTarget.closest('.df-event, .calendar-event-tooltip')) {
    keepCalendarPreviewOpen()
    return
  }
  scheduleCalendarPreviewClose()
}

function handleCalendarFocusIn(event: FocusEvent) {
  showCalendarPreview(event.target)
}

function handleCalendarFocusOut(event: FocusEvent) {
  if (event.relatedTarget instanceof Element && event.relatedTarget.closest('.calendar-event-tooltip')) return
  scheduleCalendarPreviewClose()
}

function keepCalendarPreviewOpen() {
  if (previewCloseTimer) clearTimeout(previewCloseTimer)
}

function scheduleCalendarPreviewClose() {
  if (previewCloseTimer) clearTimeout(previewCloseTimer)
  previewCloseTimer = setTimeout(() => { previewOpen.value = false }, 180)
}

function handlePreviewFocusOut(event: FocusEvent) {
  if (event.relatedTarget instanceof Element && event.relatedTarget.closest('.calendar-event-tooltip')) return
  scheduleCalendarPreviewClose()
}

watch(editorTab, async () => {
  const stage = panelStage.value
  if (!dialogOpen.value || !stage) return
  if (panelHeightTimer) clearTimeout(panelHeightTimer)
  const currentHeight = stage.getBoundingClientRect().height
  stage.style.height = `${currentHeight}px`
  stage.style.overflow = 'hidden'
  await nextTick()
  const nextHeight = stage.scrollHeight
  requestAnimationFrame(() => { stage.style.height = `${nextHeight}px` })
  panelHeightTimer = setTimeout(() => {
    stage.style.height = ''
    stage.style.overflow = ''
  }, 280)
}, { flush: 'pre' })

watch([dialogOpen, editorTab, choosingIllustration, illustrationSearch, illustrationsOffset, illustrationTotal, illustrationsLoading], async () => {
  illustrationObserver?.disconnect()
  illustrationObserver = undefined
  await nextTick()
  const sentinel = illustrationSentinel.value
  const root = sentinel?.parentElement
  if (!import.meta.client || !dialogOpen.value || editorTab.value !== 'illustration' || (!choosingIllustration.value && form.imageUrl) || !sentinel || !root || illustrationsOffset.value >= illustrationTotal.value) return
  illustrationObserver = new IntersectionObserver((entries) => {
    if (entries.some(entry => entry.isIntersecting)) void loadIllustrations()
  }, { root, rootMargin: '0px 0px 180px 0px' })
  illustrationObserver.observe(sentinel)
}, { flush: 'post' })

watch(() => ({ ...form }), () => {
  if (!dialogOpen.value || !formReady || !form.imageSlug || !form.title.trim()) return
  draftSaveState.value = 'saving'
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => { void autosaveDraft() }, 650)
})

async function autosaveDraft() {
  if (autosaveRunning) {
    autosaveAgain = true
    return
  }
  autosaveRunning = true
  saving.value = true
  formError.value = ''
  try {
    const payload = { ...form, status: 'draft' as const, sourceDate: sourceDate.value, draftDate: editingDate.value }
    await $fetch('/api/admin/puzzle-drafts', { method: 'POST', body: payload })
    editingDate.value = form.date
    sourceDate.value = payload.sourceDate || ''
    hasDraft.value = true
    draftSaveState.value = 'saved'
    await loadPuzzles()
  } catch {
    formError.value = t('admin.autosaveError')
    draftSaveState.value = 'error'
  } finally {
    autosaveRunning = false
    saving.value = false
    if (autosaveAgain) {
      autosaveAgain = false
      void autosaveDraft()
    }
  }
}

async function savePuzzle() {
  if (saving.value || !form.imageSlug) return
  saving.value = true
  formError.value = ''
  try {
    if (autosaveTimer) clearTimeout(autosaveTimer)
    const payload = { ...form, status: 'published' as const }
    if (hasDraft.value && sourceDate.value) await $fetch(`/api/admin/puzzles/${sourceDate.value}`, { method: 'PATCH', body: payload })
    else if (hasDraft.value) await $fetch('/api/admin/puzzles', { method: 'POST', body: payload })
    else if (editingDate.value) await $fetch(`/api/admin/puzzles/${editingDate.value}`, { method: 'PATCH', body: payload })
    else await $fetch('/api/admin/puzzles', { method: 'POST', body: payload })
    if (hasDraft.value) await $fetch(`/api/admin/puzzle-drafts/${encodeURIComponent(editingDate.value)}`, { method: 'DELETE' })
    dialogOpen.value = false
    notice.value = t('admin.savedPublished')
    await loadPuzzles()
  } catch (cause: any) {
    formError.value = t('admin.saveError')
  } finally {
    saving.value = false
  }
}

async function deletePuzzle() {
  if (!editingDate.value || !hasDraft.value) return
  if (autosaveTimer) clearTimeout(autosaveTimer)
  saving.value = true
  formError.value = ''
  try {
    await $fetch(`/api/admin/puzzle-drafts/${encodeURIComponent(editingDate.value)}`, { method: 'DELETE' })
    dialogOpen.value = false
    notice.value = t('admin.deletedDraft')
    await loadPuzzles()
  } catch (cause: any) {
    formError.value = t('admin.deleteError')
  } finally {
    saving.value = false
  }
}

async function handleEventMove(event: Event) {
  const fromDate = String(event.id)
  const toDate = typeof event.start === 'string' ? event.start : event.start.toString()
  if (fromDate === toDate) return
  const puzzle = allPuzzles.value.find(item => item.date === fromDate)
  if (!puzzle) return
  try {
    await $fetch(`/api/admin/puzzles/${fromDate}`, { method: 'PATCH', body: { ...puzzle, date: toDate } })
    notice.value = t('admin.moved', { title: $getLocale() === 'en' && puzzle.titleEn ? puzzle.titleEn : puzzle.title, date: formatPuzzleDate(toDate, { day: 'numeric', month: 'long' }, $getLocale() === 'en' ? 'en-US' : 'fr-FR') })
    await loadPuzzles()
  } catch (cause: any) {
    error.value = t('admin.moveError')
    await loadPuzzles()
  }
}

function toggleFullscreen() {
  fullscreen.value = !fullscreen.value
  calendarApp.value?.changeView(fullscreen.value ? 'year' : 'month')
  if (fullscreen.value) document.documentElement.classList.add('calendar-fullscreen-open')
  else document.documentElement.classList.remove('calendar-fullscreen-open')
}

onBeforeUnmount(() => {
  if (autosaveTimer) clearTimeout(autosaveTimer)
  if (previewCloseTimer) clearTimeout(previewCloseTimer)
  if (panelHeightTimer) clearTimeout(panelHeightTimer)
  illustrationObserver?.disconnect()
  document.documentElement.classList.remove('calendar-fullscreen-open')
})
</script>

<style>
#dayflow-add-event-btn { display: none !important; }
.puzzle-form { display: grid; gap: 1rem; }
.puzzle-form label { display: grid; gap: .4rem; color: var(--ink); font-size: .82rem; font-weight: 750; }
.puzzle-form input, .puzzle-form textarea, .puzzle-form select { width: 100%; min-height: 2.8rem; padding: .65rem .75rem; border: 2px solid var(--ink); border-radius: 0; background: var(--white); color: var(--ink); font: inherit; font-size: .9rem; }
.daily-grid-size-combobox { display: block; width: 100%; }
.daily-grid-size-trigger { width: 100%; min-height: 2.8rem; justify-content: space-between; border: 2px solid var(--ink) !important; border-radius: 0 !important; background: var(--white) !important; color: var(--ink) !important; padding: .65rem .75rem !important; font: inherit !important; font-size: .9rem !important; text-align: left; }
.daily-grid-size-trigger:focus-visible { outline: 3px solid var(--yellow); outline-offset: 2px; }
.daily-grid-size-list { z-index: 120 !important; min-width: var(--reka-popper-anchor-width); border: 2px solid var(--ink); border-radius: 0; background: var(--white); color: var(--ink); box-shadow: 4px 4px 0 var(--ink); }
.daily-grid-size-list input { width: 100%; min-height: 2.65rem; padding: .6rem .75rem; border: 0; border-bottom: 2px solid var(--ink); border-radius: 0; background: var(--white); color: var(--ink); font: inherit; font-size: .88rem; }
.daily-grid-size-list input:focus-visible { outline: 3px solid var(--yellow); outline-offset: -3px; }
.daily-grid-size-list [data-slot="combobox-item"] { min-height: 2.5rem; padding: .6rem .75rem; color: var(--ink); font-size: .88rem; }
.daily-grid-size-list [data-slot="combobox-item"][data-highlighted] { background: var(--yellow); color: var(--ink); }
.puzzle-form textarea { resize: vertical; }
.puzzle-form input:focus, .puzzle-form textarea:focus, .puzzle-form select:focus { outline: 3px solid var(--yellow); outline-offset: 2px; }
.calendar-legend { display: flex; flex-wrap: wrap; align-items: center; gap: .8rem 1.3rem; margin: 1rem 0 .8rem; color: var(--muted); font-size: .77rem; }
.calendar-legend > span:not(.legend-tip) { display: inline-flex; align-items: center; gap: .4rem; }
.calendar-legend i { width: .7rem; height: .7rem; border: 1px solid var(--ink); }
.legend-published { background: var(--blue); }
.legend-draft { background: var(--coral); }
.calendar-frame { min-width: 0; min-height: 620px; overflow: hidden; border: 2px solid var(--ink); background: var(--white); box-shadow: 5px 5px 0 var(--ink); --df-color-background: var(--paper); --df-color-foreground: var(--ink); --df-color-hover: var(--white); --df-color-border: var(--line); --df-color-card: var(--white); --df-color-card-foreground: var(--ink); --df-color-muted: var(--paper); --df-color-muted-foreground: var(--muted); --df-color-primary: var(--blue); --df-color-primary-foreground: var(--blue-foreground); --df-color-secondary: var(--muted); --df-color-secondary-foreground: var(--paper); --df-color-ring: var(--blue); --df-primary: var(--blue); --df-primary-foreground: var(--blue-foreground); --df-border: var(--line); }
.calendar-frame [class*="calendar"] { font-family: inherit; }
.calendar-frame button { font-family: inherit; }
.puzzle-dialog-overlay { position: fixed; z-index: 100; inset: 0; display: grid; place-items: center; overflow: hidden; padding: clamp(.65rem, 2vh, 1.4rem); background: rgb(7 10 23 / 78%); }
.puzzle-dialog { z-index: 101; display: flex !important; width: min(1000px, calc(100vw - 2rem)) !important; max-width: calc(100vw - 2rem) !important; max-height: calc(100dvh - 2rem); min-height: 0; flex-direction: column; overflow: hidden; overscroll-behavior: contain; border: 2px solid var(--ink); background: var(--paper) !important; color: var(--ink); box-shadow: 7px 7px 0 var(--ink); }
.df-mobile-event-drawer { display: none !important; }
.puzzle-dialog-header { position: relative; z-index: 3; flex: none; padding: .2rem .25rem 0; border-bottom: 1px solid var(--line); background: var(--paper); }
.puzzle-dialog-footer { position: relative; z-index: 3; flex: none; margin-top: .7rem; padding: .8rem .25rem .25rem; border-top: 1px solid var(--line); background: var(--paper); }
.puzzle-form { display: grid; min-width: 0; min-height: 0; flex: 1 1 auto; gap: .9rem; overflow-y: auto; overscroll-behavior: contain; padding: .9rem .25rem .4rem; }
.puzzle-dialog-heading { display: flex; min-height: 4.2rem; align-items: center; justify-content: space-between; gap: 1rem; padding: .25rem .2rem .65rem; }
.puzzle-dialog-title-block { display: grid; gap: .25rem; }
.puzzle-dialog-title { margin: 0; font-size: clamp(1.2rem, 2.5vw, 1.55rem); font-weight: 850; letter-spacing: -.04em; line-height: 1.1; }
.puzzle-dialog-description { color: var(--muted); font-size: .78rem; line-height: 1.45; }
.dialog-art-preview { display: flex; max-width: min(38%, 270px); min-width: 0; align-items: center; gap: .6rem; padding: .25rem .45rem .25rem .25rem; border: 1px solid var(--line); background: var(--white); color: var(--ink); font: inherit; text-align: left; cursor: pointer; }
.dialog-art-preview:hover, .calendar-preview-edit:hover { border-color: var(--blue); }
.dialog-art-preview:focus-visible, .calendar-preview-edit:focus-visible { outline: 3px solid var(--coral); outline-offset: 2px; }
.dialog-art-preview img { display: block; width: 48px; height: 42px; flex: none; object-fit: cover; }
.dialog-art-preview span { overflow: hidden; font-size: .75rem; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
.editor-tabs-header { margin-inline: -.25rem; }
.editor-tabs-list { display: flex; gap: .2rem; border-bottom: 1px solid var(--line); }
.editor-tab-trigger { min-height: 2.15rem; padding: .3rem .65rem; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--muted); font: inherit; font-size: .75rem; font-weight: 750; cursor: pointer; }
.editor-tab-trigger[data-state="active"] { border-color: var(--blue); color: var(--blue); }
.editor-tab-check { margin-left: .35rem; color: var(--success); }
.dialog-panel-stage { min-height: 280px; transition: height .24s cubic-bezier(.2,.8,.2,1); }
.editor-tab-panel { display: grid; gap: .8rem; padding-top: .15rem; }
.selected-illustration { display: flex; min-height: 76px; align-items: center; gap: .8rem; padding: .45rem; border: 1px solid var(--line); background: var(--white); }
.selected-illustration img { width: 150px; height: 112px; flex: none; object-fit: cover; }
.selected-illustration div { display: grid; gap: .2rem; min-width: 0; }
.selected-illustration span { color: var(--muted); font-size: .72rem; }
.selected-illustration strong { overflow: hidden; font-size: .86rem; text-overflow: ellipsis; white-space: nowrap; }
.selected-illustration.is-compact { min-height: 0; padding: .4rem; }
.selected-illustration.is-compact img { width: 64px; height: 56px; }
.change-illustration { min-height: 2.35rem; margin-left: auto; padding: .35rem .6rem; font-size: .73rem; white-space: nowrap; }
.puzzle-details-grid { display: grid; grid-template-columns: minmax(180px,.85fr) minmax(220px,1.15fr); gap: .85rem 1rem; align-items: start; }
.puzzle-details-grid .detail-text-field { grid-column: 1 / -1; }
.field-control-row { display: flex; align-items: stretch; gap: .55rem; }
.field-control-row > input, .field-control-row > textarea { min-width: 0; flex: 1; }
.field-control-row-note { align-items: flex-start; }
.field-control-row-note textarea { min-height: 7rem; }
.field-language-tabs { justify-self: start; }
.field-language-list { display: inline-flex; flex: none; gap: .1rem; padding: .15rem; border: 1px solid var(--line); background: var(--white); }
.field-language-trigger { min-width: 2.2rem; min-height: 1.6rem; border: 0; background: transparent; color: var(--muted); font: inherit; font-size: .67rem; font-weight: 800; cursor: pointer; }
.field-language-trigger[data-state="active"] { background: var(--blue); color: var(--blue-foreground); }
.draft-autosave { grid-column: 1 / -1; margin: 0; color: var(--muted); font-size: .78rem; }
.editor-continue { justify-self: end; min-height: 2.65rem; padding: .55rem .85rem; border: 2px solid var(--ink); background: var(--yellow); color: var(--yellow-foreground); box-shadow: 3px 3px 0 var(--ink); font: inherit; font-size: .82rem; font-weight: 800; cursor: pointer; }
.editor-continue:disabled { cursor: not-allowed; opacity: .55; }
.dialog-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: .65rem; }
.dialog-actions .admin-delete { margin-right: auto; }
.admin-cancel { min-height: 2.8rem; padding: .55rem .9rem; border: 2px solid var(--ink); background: var(--white); color: var(--ink); font: inherit; font-size: .84rem; font-weight: 800; cursor: pointer; }
.admin-cancel:disabled { cursor: wait; opacity: .65; }
.illustration-results { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: .6rem; max-height: clamp(220px, 48vh, 430px); overflow-y: auto; padding: .2rem .15rem .35rem; overscroll-behavior: contain; }
.illustration-keyboard-hint { margin: -.35rem 0 -.4rem; color: var(--muted); font-size: .68rem; }
.illustration-loading, .illustration-sentinel { grid-column: 1 / -1; }
.illustration-loading { margin: 0; padding: .45rem; color: var(--muted); font-size: .75rem; text-align: center; }
.illustration-sentinel { height: 1px; pointer-events: none; }
.illustration-option { min-width: 0; padding: .35rem; border: 2px solid transparent; background: var(--white); color: var(--ink); text-align: left; cursor: pointer; }
.illustration-option.selected { border-color: var(--blue); box-shadow: 2px 2px 0 var(--ink); }
.illustration-option:focus-visible { z-index: 1; outline: none; box-shadow: inset 0 0 0 3px var(--coral); }
.illustration-option.selected:focus-visible { box-shadow: inset 0 0 0 3px var(--coral), 2px 2px 0 var(--ink); }
.illustration-option img { display: block; width: 100%; aspect-ratio: 1.25; object-fit: cover; background: var(--yellow); }
.illustration-option span { display: block; overflow: hidden; margin-top: .35rem; font-size: .69rem; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
.empty-illustrations { grid-column: 1/-1; color: var(--muted); font-size: .8rem; }
.calendar-tooltip-anchor { position: fixed; z-index: 220; width: 1px; height: 1px; pointer-events: none; }
.calendar-event-tooltip { z-index: 221; max-width: 250px; padding: .35rem; border: 1px solid var(--ink); background: var(--white) !important; color: var(--ink); box-shadow: 3px 3px 0 var(--ink); }
.calendar-event-preview { display: grid; width: 214px; gap: .45rem; }
.calendar-event-preview img { display: block; width: 100%; aspect-ratio: 1.65; object-fit: cover; background: var(--paper); }
.calendar-event-preview > div { display: grid; gap: .15rem; }
.calendar-event-title-row { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: .4rem; }
.calendar-event-preview strong { overflow: hidden; font-size: .77rem; text-overflow: ellipsis; white-space: nowrap; }
.calendar-event-preview span { color: var(--muted); font-size: .68rem; }
.calendar-preview-edit { display: grid; width: 1.65rem; height: 1.65rem; flex: none; place-items: center; padding: .25rem; border: 1px solid var(--line); background: var(--paper); color: var(--ink); cursor: pointer; }
.calendar-preview-edit svg { width: .9rem; height: .9rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
.is-fullscreen { position: fixed; z-index: 50; inset: 0; display: flex; width: 100%; max-width: none; flex-direction: column; overflow: auto; padding: 1rem clamp(1rem, 3vw, 2.5rem); background: var(--paper); }
.is-fullscreen .admin-topline { align-items: center; }
.is-fullscreen .admin-topline .auth-back { display: none; }
.is-fullscreen .admin-topline h1 { font-size: 1.5rem; }
.is-fullscreen .calendar-legend { margin: .6rem 0; }
.is-fullscreen .page-loading-state--calendar { flex: 1; min-height: 0; }
.is-fullscreen .calendar-frame { flex: 1; min-height: 0; }
.is-fullscreen .calendar-frame .df-calendar-wrapper { height: 100% !important; min-height: 0 !important; }
@media (max-width: 760px) {
  .puzzle-details-grid { grid-template-columns: 1fr 1fr; }
  .illustration-results { grid-template-columns: repeat(4, minmax(0,1fr)); }
  .puzzle-dialog { width: calc(100vw - 1.25rem) !important; max-width: calc(100vw - 1.25rem) !important; max-height: calc(100dvh - 1.25rem); }
  .dialog-art-preview { max-width: 42%; }
  .dialog-art-preview img { width: 40px; height: 38px; }
  .calendar-frame { min-height: 570px; } }
@media (max-width: 470px) {
  .calendar-legend { gap: .7rem; }
  .calendar-frame { min-height: 540px; }
  .illustration-results { grid-template-columns: repeat(3, minmax(0,1fr)); }
  .puzzle-details-grid { grid-template-columns: 1fr; }
  .puzzle-details-grid .detail-text-field { grid-column: auto; }
  .puzzle-dialog-heading { align-items: flex-start; }
  .puzzle-dialog-description { display: none; }
  .dialog-art-preview { max-width: 44%; }
  .dialog-art-preview img { width: 36px; height: 36px; }
  .selected-illustration:not(.is-compact) { align-items: flex-start; flex-direction: column; }
  .selected-illustration:not(.is-compact) img { width: 100%; height: auto; aspect-ratio: 1.5; }
  .selected-illustration.is-compact { flex-wrap: wrap; }
  .change-illustration { width: 100%; margin-left: 0; }
  .field-control-row { align-items: flex-start; flex-direction: column; }
  .field-control-row > input, .field-control-row > textarea { width: 100%; }
  .dialog-actions { display: grid; grid-template-columns: 1fr 1fr; }
  .dialog-actions .admin-delete { grid-column: 1 / -1; margin-right: 0; }
  .dialog-actions .admin-primary { grid-column: auto; grid-row: auto; }
  .is-fullscreen { padding: .7rem; }
  .is-fullscreen .admin-topline h1 { font-size: 1.2rem; } }
</style>
