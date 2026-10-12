<template>
  <main class="page-wrap archive-page">
    <NuxtLink class="soft-link back-link" to="/">← Accueil</NuxtLink>
    <header class="archive-intro">
      <p class="section-kicker">Le temps retrouvé</p>
      <h1>Les puzzles<br><em>passés.</em></h1>
      <p>Les images restent là. Choisis un jour et rejoue-le à ton rythme.</p>
    </header>
    <div class="archive-list">
      <NuxtLink v-for="puzzle in dailyPuzzles.slice(1)" :key="puzzle.date" class="archive-card" :to="`/jouer/${puzzle.date}`">
        <img :src="puzzle.imageUrl" :alt="`Illustration ${puzzle.imageName}`" loading="lazy">
        <div class="archive-card-copy">
          <span>{{ formatPuzzleDate(puzzle.date, { day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
          <strong>{{ puzzle.title }}</strong>
          <small>9 pièces · rejouer</small>
        </div>
        <span class="card-open" aria-hidden="true">↗</span>
      </NuxtLink>
    </div>
  </main>
</template>

<script setup lang="ts">
import { dailyPuzzles, formatPuzzleDate } from '~/data/puzzles'

useSeoMeta({ title: 'Archives', description: 'Rejoue les puzzles quotidiens de Zimablue.' })
</script>
