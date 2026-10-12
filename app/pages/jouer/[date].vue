<template>
  <main class="page-wrap play-page">
    <NuxtLink class="soft-link back-link" to="/archive">
      ← Revenir aux jours précédents
    </NuxtLink>
    <header class="play-heading">
      <div>
        <p class="section-kicker">{{ formatPuzzleDate(puzzle.date) }}</p>
        <h1>{{ puzzle.title }}</h1>
        <p class="play-note">{{ puzzle.note }}</p>
      </div>
      <a class="source-link" :href="`https://zimablue.cc/illustrations/${puzzle.imageSlug}`" target="_blank" rel="noreferrer">Voir l’illustration <span aria-hidden="true">↗</span></a>
    </header>
    <div class="play-layout">
      <PuzzleBoard :puzzle="puzzle" />
      <aside class="reference-panel">
        <span class="reference-label">L’image à retrouver</span>
        <img :src="puzzle.imageUrl" :alt="`Aperçu de ${puzzle.imageName}`">
        <p>Observe les couleurs, puis échange les pièces en deux touches.</p>
      </aside>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { DailyPuzzle } from '#shared/types/puzzle'
import { formatPuzzleDate } from '#shared/types/puzzle'

const route = useRoute()
const { data: puzzleData, error } = await useFetch<DailyPuzzle>(`/api/puzzles/${route.params.date}`)
if (error.value || !puzzleData.value) throw createError({ statusCode: 404, statusMessage: 'Ce puzzle n’est pas encore dans l’archive.' })
const puzzle = computed(() => puzzleData.value!)
useSeoMeta({ title: () => puzzle.value.title, description: () => `Reconstitue l’illustration ${puzzle.value.imageName}.` })
</script>
