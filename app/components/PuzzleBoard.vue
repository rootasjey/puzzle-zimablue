<template>
  <section class="game-panel" :aria-label="t('game.boardLabel')">
    <div class="game-status">
      <p v-if="complete" class="success-note" role="status">{{ t(moves === 1 ? 'game.successOne' : 'game.successMany', { count: moves }) }}</p>
      <p v-else class="move-note" aria-live="polite">{{ selected === null ? t('game.dragOrTap') : t('game.chooseSecond') }} <span>{{ t(moves === 1 ? 'game.movesOne' : 'game.movesMany', { count: moves }) }}</span></p>
      <NButton btn="soft-gray" size="sm" type="button" @click="newBoard">{{ t('game.restart') }}</NButton>
    </div>
    <div v-if="!imageLoaded" class="board-loading" role="status">
      {{ imageError ? t('game.imageError') : t('game.loading') }}
    </div>
    <div
      v-else
      class="puzzle-board"
      ref="board"
      :style="{ '--grid-size': puzzle.gridSize, '--image-url': `url('${puzzle.imageUrl}')` }"
      role="group"
      :aria-label="t('game.gridLabel', { size: puzzle.gridSize, title: displayedTitle })"
      @pointermove="movePiece"
    >
      <button
        v-for="(piece, slot) in order"
        :key="piece"
        class="puzzle-piece"
        :class="{
          'is-selected': selected === slot,
          'is-placed': piece === slot && !complete,
          'is-dragging': dragging?.from === slot && dragging.moved,
          'is-drop-target': dragging?.moved && dragging.target === slot && dragging.from !== slot,
        }"
        :style="[pieceStyle(piece), dragStyle(slot)]"
        :data-slot="slot"
        type="button"
        :aria-label="t('game.pieceLabel', { piece: slot + 1, position: piece + 1, placed: piece === slot ? t('game.placed') : '' })"
        :aria-pressed="selected === slot"
        @pointerdown="startDrag(slot, $event)"
        @pointerup="finishDrag"
        @pointercancel="cancelDrag"
        @click="choosePiece(slot)"
      />
    </div>
    <p class="board-caption">{{ complete ? t('game.tomorrow') : t('game.caption') }}</p>
  </section>
</template>

<script setup lang="ts">
import type { DailyPuzzle } from '#shared/types/puzzle'
import { usePuzzleGame } from '~/composables/usePuzzleGame'

const props = defineProps<{ puzzle: DailyPuzzle }>()
const { $getLocale, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const displayedTitle = computed(() => $getLocale() === 'en' && props.puzzle.titleEn ? props.puzzle.titleEn : props.puzzle.title)
const { order, selected, moves, complete, started, newBoard, choose, swap } = usePuzzleGame(props.puzzle)
const imageLoaded = ref(false)
const imageError = ref(false)
const board = ref<HTMLElement>()
const dragging = ref<{ pointerId: number; from: number; startX: number; startY: number; x: number; y: number; moved: boolean; target: number | null } | null>(null)
const ignoreClick = ref(false)
let ignoreClickTimer: ReturnType<typeof setTimeout> | undefined

function startDrag(slot: number, event: PointerEvent) {
  if (complete.value || event.button !== 0) return
  const button = event.currentTarget
  if (!(button instanceof HTMLButtonElement)) return
  button.setPointerCapture(event.pointerId)
  dragging.value = {
    pointerId: event.pointerId,
    from: slot,
    startX: event.clientX,
    startY: event.clientY,
    x: event.clientX,
    y: event.clientY,
    moved: false,
    target: null,
  }
}

function movePiece(event: PointerEvent) {
  const drag = dragging.value
  if (!drag || drag.pointerId !== event.pointerId) return
  drag.x = event.clientX
  drag.y = event.clientY
  if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return
  drag.moved = true
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLButtonElement>('.puzzle-piece')
  drag.target = target && board.value?.contains(target) ? Number(target.dataset.slot) : null
}

function finishDrag(event: PointerEvent) {
  const drag = dragging.value
  if (!drag || drag.pointerId !== event.pointerId) return
  if (drag.moved) {
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLButtonElement>('.puzzle-piece')
    const targetSlot = target && board.value?.contains(target) ? Number(target.dataset.slot) : null
    if (targetSlot !== null && targetSlot !== drag.from) swap(drag.from, targetSlot)
    ignoreClick.value = true
    if (ignoreClickTimer) clearTimeout(ignoreClickTimer)
    ignoreClickTimer = setTimeout(() => { ignoreClick.value = false }, 0)
  }
  dragging.value = null
}

function cancelDrag() {
  dragging.value = null
}

function choosePiece(slot: number) {
  if (ignoreClick.value) {
    ignoreClick.value = false
    if (ignoreClickTimer) clearTimeout(ignoreClickTimer)
    return
  }
  choose(slot)
}

function dragStyle(slot: number) {
  const drag = dragging.value
  if (!drag || drag.from !== slot || !drag.moved) return {}
  return { transform: `translate(${drag.x - drag.startX}px, ${drag.y - drag.startY}px) scale(.96)` }
}

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

onBeforeUnmount(() => {
  if (ignoreClickTimer) clearTimeout(ignoreClickTimer)
})
</script>