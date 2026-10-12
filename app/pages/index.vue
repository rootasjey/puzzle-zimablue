<template>
  <main class="page-wrap home-page">
    <section v-if="featured" class="daily-feature">
      <div class="feature-art">
        <img :src="featured.imageUrl" :alt="`Illustration ${featured.imageName}`" fetchpriority="high">
        <span class="art-index">{{ formatPuzzleDate(featured.date, { day: 'numeric', month: 'numeric' }) }}</span>
      </div>
      <div class="feature-copy">
        <p class="section-kicker">L’illustration du jour</p>
        <h1>Quelques pièces<br>de <em>bleu.</em></h1>
        <p class="feature-description">Chaque jour, une illustration de Zimablue à reconstituer. Prends une minute, retrouve l’image, puis reviens demain.</p>
        <div class="today-line"><span class="today-dot" />{{ formatPuzzleDate(featured.date) }} <span class="line-divider">·</span> {{ featured.gridSize ** 2 }} pièces</div>
        <NuxtLink class="play-link" :to="`/jouer/${featured.date}`">Jouer au puzzle du jour <span aria-hidden="true">↗</span></NuxtLink>
      </div>
    </section>
    <p v-else class="empty-state">Le prochain puzzle est en préparation.</p>

    <section class="archive-preview" aria-labelledby="archive-title">
      <div class="section-heading">
        <div>
          <p class="section-kicker">À retrouver</p>
          <h2 id="archive-title">Les jours précédents</h2>
        </div>
        <NuxtLink class="soft-link archive-all" to="/archive">Toute l’archive <span aria-hidden="true">↗</span></NuxtLink>
      </div>
      <div class="archive-grid">
        <NuxtLink v-for="puzzle in archive" :key="puzzle.date" class="archive-card" :to="`/jouer/${puzzle.date}`">
          <img :src="puzzle.imageUrl" :alt="`Illustration ${puzzle.imageName}`" loading="lazy">
          <div class="archive-card-copy">
            <span>{{ formatPuzzleDate(puzzle.date, { day: 'numeric', month: 'long' }) }}</span>
            <strong>{{ puzzle.title }}</strong>
          </div>
          <span class="card-open" aria-hidden="true">↗</span>
        </NuxtLink>
      </div>
    </section>

    <p class="prototype-note">Une sélection manuelle d’illustrations, chargées depuis zimablue.cc.</p>
  </main>
</template>

<script setup lang="ts">
import type { DailyPuzzle } from '#shared/types/puzzle'
import { formatPuzzleDate } from '#shared/types/puzzle'

const { data: puzzles } = await useFetch<DailyPuzzle[]>('/api/puzzles', { key: 'published-puzzles-home' })
const parisToday = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date())
const featured = computed(() => puzzles.value?.find(puzzle => puzzle.date === parisToday))
const archive = computed(() => puzzles.value?.filter(puzzle => puzzle.date < parisToday).slice(0, 2) ?? [])
useSeoMeta({ title: 'Un puzzle par jour', description: 'Une illustration de Zimablue à reconstituer chaque jour.' })
</script>
