<template>
  <section class="game-panel" aria-label="Plateau de puzzle">
    <div class="game-status">
      <p v-if="complete" class="success-note" role="status">Image reconstituée en {{ moves }} coup{{ moves > 1 ? 's' : '' }}.</p>
      <p v-else class="move-note" aria-live="polite">{{ selected === null ? 'Choisis une pièce, puis sa destination.' : 'Choisis la seconde pièce à échanger.' }} <span>{{ moves }} coup{{ moves > 1 ? 's' : '' }}</span></p>
      <NButton btn="soft-gray" size="sm" type="button" @click="newBoard">Recommencer</NButton>
    </div>
    <div v-if="!imageLoaded" class="board-loading" role="status">
      {{ imageError ? 'Impossible de charger cette illustration.' : 'Préparation des pièces…' }}
    </div>
    <div
      v-else
      class="puzzle-board"
      :style="{ '--grid-size': puzzle.gridSize, '--image-url': `url('${puzzle.imageUrl}')` }"
      role="group"
      :aria-label="`Puzzle ${puzzle.gridSize} par ${puzzle.gridSize} de ${puzzle.title}`"
    >
      <button
        v-for="(piece, slot) in order"
        :key="piece"
        class="puzzle-piece"
        :class="{ 'is-selected': selected === slot, 'is-placed': piece === slot && !complete }"
        :style="pieceStyle(piece)"
        type="button"
        :aria-label="`Pièce ${slot + 1}, position ${piece + 1}${piece === slot ? ', bien placée' : ''}`"
        :aria-pressed="selected === slot"
        @click="choose(slot)"
      />
    </div>
    <p class="board-caption">{{ complete ? 'Bien joué. À demain pour une nouvelle image.' : 'Deux touches suffisent pour échanger des pièces.' }}</p>
  </section>
</template>

<script setup lang="ts">
import type { DailyPuzzle } from '#shared/types/puzzle'
import { usePuzzleGame } from '~/composables/usePuzzleGame'

const props = defineProps<{ puzzle: DailyPuzzle }>()
const { order, selected, moves, complete, started, newBoard, choose } = usePuzzleGame(props.puzzle)
const imageLoaded = ref(false)
const imageError = ref(false)

function pieceStyle(piece: number) {
  const column = piece % props.puzzle.gridSize
  const row = Math.floor(piece / props.puzzle.gridSize)
  const last = (props.puzzle.gridSize - 1) * 100
  return {
    backgroundPosition: `${last ? column / (props.puzzle.gridSize - 1) * 100 : 0}% ${last ? row / (props.puzzle.gridSize - 1) * 100 : 0}%`,
  }
}

onMounted(async () => {
  const image = new Image()
  image.src = props.puzzle.imageUrl
  try {
    await image.decode()
    imageLoaded.value = true
    if (!started.value) newBoard()
  } catch {
    imageError.value = true
  }
})
</script>
