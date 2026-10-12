<template>
  <main class="page-wrap home-page">
    <section class="daily-feature">
      <div class="feature-art">
        <img :src="today.imageUrl" :alt="`Illustration ${today.imageName}`" fetchpriority="high">
        <span class="art-index">12 / 10</span>
      </div>
      <div class="feature-copy">
        <p class="section-kicker">L’illustration du jour</p>
        <h1>Quelques pièces<br>de <em>bleu.</em></h1>
        <p class="feature-description">Chaque jour, une illustration de Zimablue à reconstituer. Prends une minute, retrouve l’image, puis reviens demain.</p>
        <div class="today-line"><span class="today-dot" />{{ formatPuzzleDate(today.date) }} <span class="line-divider">·</span> 9 pièces</div>
        <NuxtLink class="play-link" :to="`/jouer/${today.date}`">Jouer au puzzle du jour <span aria-hidden="true">↗</span></NuxtLink>
      </div>
    </section>

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

    <p class="prototype-note">Prototype — illustrations sélectionnées manuellement · images chargées depuis zimablue.cc</p>
  </main>
</template>

<script setup lang="ts">
import { dailyPuzzles, today, formatPuzzleDate } from '~/data/puzzles'

const archive = dailyPuzzles.slice(1)
useSeoMeta({ title: 'Un puzzle par jour', description: 'Une illustration de Zimablue à reconstituer chaque jour.' })
</script>
