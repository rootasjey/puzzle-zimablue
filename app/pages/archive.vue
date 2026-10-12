<template>
  <main class="page-wrap archive-page">
    <NuxtLink class="soft-link back-link" to="/">← Accueil</NuxtLink>
    <header class="archive-intro">
      <p class="section-kicker">Le temps retrouvé</p>
      <h1>Les puzzles<br><em>passés.</em></h1>
      <p>Les images restent là. Choisis un jour et rejoue-le à ton rythme.</p>
    </header>
    <div class="archive-list">
      <NuxtLink v-for="puzzle in archive" :key="puzzle.date" class="archive-card" :to="`/jouer/${puzzle.date}`">
        <img :src="puzzle.imageUrl" :alt="`Illustration ${puzzle.imageName}`" loading="lazy">
        <div class="archive-card-copy">
          <span>{{ formatPuzzleDate(puzzle.date, { day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
          <strong>{{ puzzle.title }}</strong>
          <small>{{ puzzle.gridSize ** 2 }} pièces · rejouer</small>
        </div>
        <span class="card-open" aria-hidden="true">↗</span>
      </NuxtLink>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { DailyPuzzle } from '#shared/types/puzzle'
import { formatPuzzleDate } from '#shared/types/puzzle'

const { data: puzzles } = await useFetch<DailyPuzzle[]>('/api/puzzles', { key: 'published-puzzles-archive' })
const parisToday = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date())
const archive = computed(() => puzzles.value?.filter(puzzle => puzzle.date < parisToday) ?? [])
useSeoMeta({ title: 'Archives', description: 'Rejoue les puzzles quotidiens de Zimablue.' })
</script>
