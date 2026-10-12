<template>
  <main class="admin-page" :class="{ 'is-fullscreen': fullscreen }">
    <div class="admin-topline">
      <div>
        <NuxtLink class="auth-back" :to="$localePath({ name: 'index' })">{{ t('admin.back') }}</NuxtLink>
        <p class="section-kicker">{{ t('admin.kicker') }}</p>
        <h1>{{ t('admin.calendarTitle') }}</h1>
        <p class="admin-intro">{{ t('admin.calendarIntro') }}</p>
      </div>
      <div class="admin-actions">
        <button class="admin-secondary" @click="toggleFullscreen">{{ fullscreen ? t('admin.exitFullscreen') : t('admin.fullscreen') }}</button>
        <button class="admin-primary admin-add" @click="openNew()">{{ t('admin.newPuzzle') }}</button>
      </div>
    </div>

    <div class="calendar-legend">
      <span><i class="legend-published" />{{ t('admin.published') }}</span>
      <span><i class="legend-draft" />{{ t('admin.draft') }}</span>
      <span class="legend-tip">{{ t('admin.dragCalendar') }}</span>
    </div>

    <div v-if="error" class="admin-alert" role="alert">{{ error }}</div>
    <div v-if="notice" class="admin-notice" role="status">{{ notice }}</div>
    <div v-if="loading" class="calendar-loading">{{ t('admin.loading') }}</div>
    <ClientOnly v-else>
      <div class="calendar-frame">
        <DayFlowCalendar v-if="calendarApp" :calendar="calendarApp" />
      </div>
      <template #fallback><div class="calendar-loading">{{ t('admin.loading') }}</div></template>
    </ClientOnly>

    <NDialog
      v-model:open="dialogOpen"
      :title="editingDate ? t('admin.editPuzzle') : t('admin.preparePuzzle')"
      :description="t('admin.dialogDescription')"
      scrollable
      :_dialog-content="{ class: 'puzzle-dialog' }"
      :_dialog-header="{ class: 'puzzle-dialog-header' }"
      :_dialog-footer="{ class: 'puzzle-dialog-footer' }"
    >
      <form id="puzzle-editor-form" class="puzzle-form" @submit.prevent="savePuzzle">
        <NTabs v-model="editorTab" class="editor-tabs" :unmount-on-hide="false">
          <NTabsList class="editor-tabs-list" :aria-label="t('admin.steps')">
            <NTabsTrigger value="illustration" class="editor-tab-trigger">
              <span>{{ t('admin.illustration') }}</span>
              <span v-if="form.imageSlug" class="editor-tab-check" :aria-label="t('admin.illustrationSelected')">✓</span>
            </NTabsTrigger>
            <NTabsTrigger value="details" class="editor-tab-trigger">{{ t('admin.details') }}</NTabsTrigger>
          </NTabsList>

          <NTabsContent value="illustration" class="editor-tab-panel">
            <div v-if="form.imageUrl" class="selected-illustration">
              <img :src="form.imageUrl" :alt="form.imageName">
              <div><span>{{ t('admin.selectedIllustration') }}</span><strong>{{ form.imageName }}</strong></div>
            </div>
            <label for="illustration-search">{{ t('admin.searchIllustrations') }}</label>
            <input id="illustration-search" v-model="illustrationSearch" type="search" :placeholder="t('admin.searchPlaceholder')">
            <div class="illustration-results" :aria-busy="illustrationsLoading">
              <button
                v-for="image in filteredIllustrations"
                :key="image.slug"
                type="button"
                class="illustration-option"
                :class="{ selected: form.imageSlug === image.slug }"
                :aria-pressed="form.imageSlug === image.slug"
                @click="selectIllustration(image)"
              >
                <img :src="image.url" :alt="image.name" loading="lazy">
                <span>{{ image.name }}</span>
              </button>
              <p v-if="!filteredIllustrations.length && !illustrationsLoading" class="empty-illustrations">{{ t('admin.noIllustrations') }}</p>
            </div>
            <button v-if="illustrationsOffset < illustrationTotal" type="button" class="illustrations-more" :disabled="illustrationsLoading" @click="loadIllustrations()">
              {{ illustrationsLoading ? t('admin.loading') : t('admin.loadMore') }}
            </button>
            <button class="editor-continue" type="button" :disabled="!form.imageSlug" @click="editorTab = 'details'">{{ t('admin.continue') }} <span aria-hidden="true">→</span></button>
          </NTabsContent>

          <NTabsContent value="details" class="editor-tab-panel">
            <div class="puzzle-details-grid">
              <label>{{ t('admin.date') }}<input v-model="form.date" type="date" required></label>
              <label>{{ t('admin.title') }}<input v-model="form.title" maxlength="120" required></label>
              <label class="puzzle-note-field">{{ t('admin.note') }}<textarea v-model="form.note" rows="3" maxlength="500" /></label>
              <label>{{ t('admin.titleEnglish') }}<input v-model="form.titleEn" maxlength="120"></label>
              <label class="puzzle-note-field">{{ t('admin.noteEnglish') }}<textarea v-model="form.noteEn" rows="3" maxlength="500" /></label>
              <p class="english-optional">{{ t('admin.englishOptional') }}</p>
              <label>{{ t('admin.pieceCount') }}
                <select v-model.number="form.gridSize">
                  <option :value="3">{{ t('admin.easy', { count: 9 }) }}</option>
                  <option :value="4">{{ t('admin.balanced', { count: 16 }) }}</option>
                  <option :value="5">{{ t('admin.challenging', { count: 25 }) }}</option>
                </select>
              </label>
              <label>{{ t('admin.status') }}
                <select v-model="form.status">
                  <option value="draft">{{ t('admin.draft') }}</option>
                  <option value="published">{{ t('admin.published') }}</option>
                </select>
              </label>
            </div>
          </NTabsContent>
        </NTabs>
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      </form>
      <template #footer>
        <div class="dialog-actions">
          <button v-if="editingDate && form.status === 'draft'" type="button" class="admin-delete" :disabled="saving" @click="deletePuzzle">{{ t('admin.deleteDraft') }}</button>
          <button type="button" class="admin-cancel" :disabled="saving" @click="dialogOpen = false">{{ t('admin.cancel') }}</button>
          <button type="submit" form="puzzle-editor-form" class="admin-primary" :disabled="saving || !form.imageSlug">
            {{ saving ? t('admin.saving') : form.status === 'published' ? t('admin.savePublish') : t('admin.saveDraft') }}
          </button>
        </div>
      </template>
    </NDialog>
  </main>
</template>

<script setup lang="ts">
import { Temporal } from 'temporal-polyfill'
import type { CalendarType, Event, UseCalendarAppReturn } from '@dayflow/vue'
import { createDayView, createMonthView, createWeekView, createYearView, DayFlowCalendar, useCalendarApp } from '@dayflow/vue'
import type { DailyPuzzle } from '#shared/types/puzzle'
import { formatPuzzleDate } from '#shared/types/puzzle'

definePageMeta({ name: 'admin-calendar', middleware: 'admin' })
const { $getLocale, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const { $defineI18nRoute } = useNuxtApp()
await $defineI18nRoute({ localeRoutes: { en: '/admin/calendar' } })

interface Illustration { name: string; slug: string; url: string }
interface PuzzleForm {
  date: string
  title: string
  note: string
  titleEn: string
  noteEn: string
  imageName: string
  imageSlug: string
  imageUrl: string
  gridSize: number
  status: 'draft' | 'published'
}

const calendarApp = shallowRef<UseCalendarAppReturn>()
const allPuzzles = ref<DailyPuzzle[]>([])
const loading = ref(true)
const error = ref('')
const notice = ref('')
const fullscreen = ref(false)
const dialogOpen = ref(false)
const editorTab = ref<'illustration' | 'details'>('illustration')
const editingDate = ref('')
const saving = ref(false)
const formError = ref('')
const illustrationSearch = ref('')
const illustrations = ref<Illustration[]>([])
const illustrationsOffset = ref(0)
const illustrationTotal = ref(0)
const illustrationsLoading = ref(false)
const form = reactive<PuzzleForm>(emptyForm())
const filteredIllustrations = computed(() => {
  const query = illustrationSearch.value.trim().toLocaleLowerCase($getLocale())
  return illustrations.value.filter(image => !query || image.name.toLocaleLowerCase($getLocale()).includes(query) || image.slug.toLowerCase().includes(query))
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
  return { date, title: '', note: '', titleEn: '', noteEn: '', imageName: '', imageSlug: '', imageUrl: '', gridSize: 3, status: 'draft' }
}

function todayDate() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date())
}

function toCalendarEvent(puzzle: DailyPuzzle): Event {
  const start = Temporal.PlainDate.from(puzzle.date)
  return {
    id: puzzle.date,
    title: puzzle.title,
    description: t('admin.eventDescription', { count: puzzle.gridSize ** 2, image: puzzle.imageName }),
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
  editingDate.value = ''
  Object.assign(form, emptyForm(date))
  formError.value = ''
  editorTab.value = 'illustration'
  dialogOpen.value = true
}

function openEdit(date: string) {
  const puzzle = allPuzzles.value.find(item => item.date === date)
  if (!puzzle) return openNew(date)
  editingDate.value = puzzle.date
  Object.assign(form, {
    date: puzzle.date,
    title: puzzle.title,
    note: puzzle.note,
    titleEn: puzzle.titleEn,
    noteEn: puzzle.noteEn,
    imageName: puzzle.imageName,
    imageSlug: puzzle.imageSlug,
    imageUrl: puzzle.imageUrl,
    gridSize: puzzle.gridSize,
    status: puzzle.status,
  })
  formError.value = ''
  editorTab.value = 'details'
  dialogOpen.value = true
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
  if (!form.title) form.title = image.name
}

async function savePuzzle() {
  saving.value = true
  formError.value = ''
  try {
    const payload = { ...form }
    if (editingDate.value) await $fetch(`/api/admin/puzzles/${editingDate.value}`, { method: 'PATCH', body: payload })
    else await $fetch('/api/admin/puzzles', { method: 'POST', body: payload })
    dialogOpen.value = false
    notice.value = payload.status === 'published' ? t('admin.savedPublished') : t('admin.savedDraft')
    await loadPuzzles()
  } catch (cause: any) {
    formError.value = t('admin.saveError')
  } finally {
    saving.value = false
  }
}

async function deletePuzzle() {
  if (!editingDate.value) return
  saving.value = true
  formError.value = ''
  try {
    await $fetch(`/api/admin/puzzles/${editingDate.value}`, { method: 'DELETE' })
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

onBeforeUnmount(() => document.documentElement.classList.remove('calendar-fullscreen-open'))
</script>
