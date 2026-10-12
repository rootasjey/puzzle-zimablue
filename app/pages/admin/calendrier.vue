<template>
  <main class="admin-page" :class="{ 'is-fullscreen': fullscreen }">
    <div class="admin-topline">
      <div>
        <NuxtLink class="auth-back" to="/">← Retour au jeu</NuxtLink>
        <p class="section-kicker">Atelier des puzzles</p>
        <h1>Calendrier éditorial</h1>
        <p class="admin-intro">Déplace les illustrations entre les jours, puis ouvre une date pour préparer sa publication.</p>
      </div>
      <div class="admin-actions">
        <button class="admin-secondary" @click="toggleFullscreen">{{ fullscreen ? 'Quitter le plein écran' : 'Plein écran' }}</button>
        <button class="admin-primary admin-add" @click="openNew()">＋ Nouveau puzzle</button>
      </div>
    </div>

    <div class="calendar-legend">
      <span><i class="legend-published" />Publié</span>
      <span><i class="legend-draft" />Brouillon</span>
      <span class="legend-tip">Glisse un puzzle sur une autre date pour le reprogrammer.</span>
    </div>

    <div v-if="error" class="admin-alert" role="alert">{{ error }}</div>
    <div v-if="notice" class="admin-notice" role="status">{{ notice }}</div>
    <div v-if="loading" class="calendar-loading">Chargement du calendrier…</div>
    <ClientOnly v-else>
      <div class="calendar-frame">
        <DayFlowCalendar v-if="calendarApp" :calendar="calendarApp" />
      </div>
      <template #fallback><div class="calendar-loading">Ouverture du calendrier…</div></template>
    </ClientOnly>

    <NDrawer v-model:open="drawerOpen" direction="right" :title="editingDate ? 'Modifier le puzzle' : 'Préparer un puzzle'" description="Une illustration et une date par jour." :_drawer-content="{ class: 'puzzle-drawer' }">
      <template #body>
        <form class="puzzle-form" @submit.prevent="savePuzzle">
          <label>Date de publication<input v-model="form.date" type="date" required></label>
          <label>Illustration
            <input v-model="illustrationSearch" type="search" placeholder="Rechercher une illustration" @input="loadIllustrations(true)">
          </label>
          <div class="illustration-results" :aria-busy="illustrationsLoading">
            <button
              v-for="image in illustrations"
              :key="image.slug"
              type="button"
              class="illustration-option"
              :class="{ selected: form.imageSlug === image.slug }"
              @click="selectIllustration(image)"
            >
              <img :src="image.url" :alt="''" loading="lazy">
              <span>{{ image.name }}</span>
            </button>
            <p v-if="!illustrations.length && !illustrationsLoading" class="empty-illustrations">Aucune illustration trouvée.</p>
          </div>
          <label>Titre<input v-model="form.title" maxlength="120" required></label>
          <label>Petit mot<textarea v-model="form.note" rows="2" maxlength="500" /></label>
          <label>Nombre de pièces
            <select v-model.number="form.gridSize">
              <option :value="3">9 pièces — tranquille</option>
              <option :value="4">16 pièces — équilibré</option>
              <option :value="5">25 pièces — corsé</option>
            </select>
          </label>
          <label>État
            <select v-model="form.status">
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
            </select>
          </label>
          <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
          <div class="drawer-actions">
            <button class="admin-primary" :disabled="saving || !form.imageSlug">{{ saving ? 'Enregistrement…' : form.status === 'published' ? 'Enregistrer et publier' : 'Enregistrer le brouillon' }}</button>
            <button v-if="editingDate && form.status === 'draft'" type="button" class="admin-delete" @click="deletePuzzle">Supprimer le brouillon</button>
          </div>
        </form>
      </template>
    </NDrawer>
  </main>
</template>

<script setup lang="ts">
import { Temporal } from 'temporal-polyfill'
import type { CalendarType, Event, UseCalendarAppReturn } from '@dayflow/vue'
import { createDayView, createMonthView, createWeekView, createYearView, DayFlowCalendar, useCalendarApp } from '@dayflow/vue'
import type { DailyPuzzle } from '#shared/types/puzzle'
import { formatPuzzleDate } from '#shared/types/puzzle'

definePageMeta({ middleware: 'admin' })

interface Illustration { name: string; slug: string; url: string }
interface PuzzleForm {
  date: string
  title: string
  note: string
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
const drawerOpen = ref(false)
const editingDate = ref('')
const saving = ref(false)
const formError = ref('')
const illustrationSearch = ref('')
const illustrations = ref<Illustration[]>([])
const illustrationsLoading = ref(false)
const form = reactive<PuzzleForm>(emptyForm())
const calendars: CalendarType[] = [
  { id: 'published', name: 'Publié', colors: { eventColor: '#254be8', eventSelectedColor: '#1738bd', lineColor: '#1839bd', textColor: '#fff' } },
  { id: 'draft', name: 'Brouillon', colors: { eventColor: '#ed6554', eventSelectedColor: '#cc493d', lineColor: '#c84c40', textColor: '#fff' } },
]

onMounted(async () => {
  await loadPuzzles()
  await loadIllustrations()
})

function emptyForm(date = todayDate()): PuzzleForm {
  return { date, title: '', note: '', imageName: '', imageSlug: '', imageUrl: '', gridSize: 3, status: 'draft' }
}

function todayDate() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date())
}

function toCalendarEvent(puzzle: DailyPuzzle): Event {
  const start = Temporal.PlainDate.from(puzzle.date)
  return {
    id: puzzle.date,
    title: puzzle.title,
    description: `${puzzle.gridSize ** 2} pièces · ${puzzle.imageName}`,
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
        createMonthView({ label: 'Mois', startOfWeek: 1, gridDateClick: (date) => openNew(formatDate(date)) }),
        createWeekView({ label: 'Semaine', startOfWeek: 1 }),
        createDayView({ label: 'Jour' }),
        createYearView({ label: 'Année', mode: 'year-canvas' }),
      ],
      events: allPuzzles.value.map(toCalendarEvent),
      calendars,
      defaultCalendar: 'published',
      defaultView: 'month',
      initialDate: new Date(`${todayDate()}T12:00:00+02:00`),
      locale: {
        code: 'fr-FR',
        messages: {
          allDay: 'Toute la journée',
          noEvents: 'Aucun puzzle ce jour-là',
          today: 'Aujourd’hui',
          day: 'Jour',
          week: 'Semaine',
          month: 'Mois',
          year: 'Année',
          search: 'Rechercher',
          createCalendar: 'Ajouter un calendrier',
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
    error.value = cause?.data?.statusMessage || 'Le calendrier n’a pas pu être chargé.'
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
  drawerOpen.value = true
}

function openEdit(date: string) {
  const puzzle = allPuzzles.value.find(item => item.date === date)
  if (!puzzle) return openNew(date)
  editingDate.value = puzzle.date
  Object.assign(form, {
    date: puzzle.date,
    title: puzzle.title,
    note: puzzle.note,
    imageName: puzzle.imageName,
    imageSlug: puzzle.imageSlug,
    imageUrl: puzzle.imageUrl,
    gridSize: puzzle.gridSize,
    status: puzzle.status,
  })
  formError.value = ''
  drawerOpen.value = true
}

async function loadIllustrations(reset = false) {
  if (illustrationsLoading.value) return
  illustrationsLoading.value = true
  try {
    const result = await $fetch<{ items: Illustration[] }>('/api/admin/illustrations', { query: { limit: 100, offset: 0 } })
    const query = illustrationSearch.value.trim().toLocaleLowerCase('fr')
    illustrations.value = result.items.filter(item => !query || item.name.toLocaleLowerCase('fr').includes(query) || item.slug.toLowerCase().includes(query))
    if (!reset && !form.imageSlug) {
      const chosen = illustrations.value.find(item => item.slug === form.imageSlug)
      if (chosen) selectIllustration(chosen)
    }
  } catch (cause: any) {
    error.value = cause?.data?.statusMessage || 'Les illustrations Zimablue sont momentanément inaccessibles.'
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
    drawerOpen.value = false
    notice.value = payload.status === 'published' ? 'Puzzle enregistré et publié.' : 'Brouillon enregistré.'
    await loadPuzzles()
  } catch (cause: any) {
    formError.value = cause?.data?.statusMessage || 'Le puzzle n’a pas pu être enregistré.'
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
    drawerOpen.value = false
    notice.value = 'Brouillon supprimé.'
    await loadPuzzles()
  } catch (cause: any) {
    formError.value = cause?.data?.statusMessage || 'Le brouillon n’a pas pu être supprimé.'
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
    notice.value = `${puzzle.title} déplacé au ${formatPuzzleDate(toDate, { day: 'numeric', month: 'long' })}.`
    await loadPuzzles()
  } catch (cause: any) {
    error.value = cause?.data?.statusMessage || 'Déplacement impossible. Vérifie que cette date est libre.'
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
