<template>
  <section class="game-panel" :aria-label="t('game.boardLabel')">
    <div v-if="!imageLoaded" class="board-loading" role="status">
      {{ imageError ? t('game.imageError') : t('game.loading') }}
    </div>
    <TransitionGroup
      v-else
      name="piece"
      tag="div"
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
    </TransitionGroup>
    <div class="board-tools">
      <p v-if="complete" class="success-note" role="status">{{ t(moves === 1 ? 'game.successOne' : 'game.successMany', { count: moves }) }}</p>
      <p v-else class="move-count" aria-live="polite">{{ t(moves === 1 ? 'game.movesOne' : 'game.movesMany', { count: moves }) }}</p>
      <button class="restart-button" type="button" @click="newBoard">{{ t('game.restart') }}</button>
    </div>
    <Teleport to="body">
      <Transition name="completion">
        <section v-if="complete && completionOrigin" class="completion-screen" role="region" aria-labelledby="completion-title">
          <div class="completion-content">
            <div class="completion-board" :style="completionBoardStyle" aria-hidden="true">
              <div v-for="piece in order" :key="piece" class="completion-piece" :style="pieceStyle(piece)" />
            </div>
            <h2 id="completion-title" ref="completionHeading" class="completion-title" tabindex="-1">{{ t('game.congratulations') }}</h2>
            <p class="completion-copy" role="status">{{ t(moves === 1 ? 'game.successOne' : 'game.successMany', { count: moves }) }}</p>
            <p v-if="completionSaved" class="completion-account-note" role="status">{{ t('game.progressSaved') }}</p>
            <NuxtLink v-else-if="!loggedIn" class="play-link completion-account-link" :to="registerLink">{{ t('game.saveProgress') }}</NuxtLink>
            <NuxtLink v-if="!loggedIn" class="completion-login-link" :to="signInLink">{{ t('account.alreadyHaveAccount') }}</NuxtLink>
            <p v-else-if="completionSaveError" class="completion-account-note" role="status">{{ t('game.saveProgressError') }}</p>
            <button class="restart-button completion-restart" type="button" @click="newBoard">{{ t('game.restart') }}</button>
          </div>
        </section>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { DailyPuzzle } from '#shared/types/puzzle'
import { usePuzzleGame } from '~/composables/usePuzzleGame'

const props = defineProps<{ puzzle: DailyPuzzle }>()
const { $getLocale, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const displayedTitle = computed(() => $getLocale() === 'en' && props.puzzle.titleEn ? props.puzzle.titleEn : props.puzzle.title)
const { loggedIn } = useUserSession()
const { $localePath } = useNuxtApp()
const completionSaved = ref(false)
const completionSaveError = ref(false)
const registerLink = computed(() => $localePath({ name: 'account-sign-up', query: { puzzleDate: props.puzzle.date, moves: String(moves.value) } }))
const signInLink = computed(() => $localePath({ name: 'account-sign-in', query: { puzzleDate: props.puzzle.date, moves: String(moves.value) } }))
const { order, selected, moves, complete, started, newBoard, choose, swap } = usePuzzleGame(props.puzzle)
const imageLoaded = ref(false)
const imageError = ref(false)
const board = ref<ComponentPublicInstance | null>(null)
const completionHeading = ref<HTMLHeadingElement | null>(null)
const completionOrigin = ref<{ x: number; y: number; scale: number } | null>(null)
const dragging = ref<{ pointerId: number; from: number; startX: number; startY: number; x: number; y: number; moved: boolean; target: number | null } | null>(null)
const ignoreClick = ref(false)
let ignoreClickTimer: ReturnType<typeof setTimeout> | undefined

const completionBoardStyle = computed(() => completionOrigin.value ? {
  '--grid-size': props.puzzle.gridSize,
  '--image-url': `url('${props.puzzle.imageUrl}')`,
  '--origin-x': `${completionOrigin.value.x}px`,
  '--origin-y': `${completionOrigin.value.y}px`,
  '--origin-scale': completionOrigin.value.scale,
} : {})

watch(complete, async (isComplete) => {
  if (!import.meta.client) return
  document.querySelector('.site-shell')?.toggleAttribute('inert', isComplete)

  if (isComplete) {
    if (loggedIn.value) {
      try {
        await $fetch('/api/account/progress', { method: 'POST', body: { puzzleDate: props.puzzle.date, moves: moves.value } })
        completionSaved.value = true
      } catch {
        completionSaveError.value = true
      }
    }
    await nextTick()
    const element = board.value?.$el
    if (element instanceof HTMLElement) {
      const rect = element.getBoundingClientRect()
      const targetSize = Math.min(window.innerWidth * 0.88, window.innerHeight * 0.68, 640)
      completionOrigin.value = {
        x: rect.left + rect.width / 2 - window.innerWidth / 2,
        y: rect.top + rect.height / 2 - (window.innerHeight / 2 - 48),
        scale: rect.width / targetSize,
      }
    } else {
      completionOrigin.value = { x: 0, y: 0, scale: 0.84 }
    }
    await nextTick()
    completionHeading.value?.focus()
    return
  }

  completionOrigin.value = null
  completionSaved.value = false
  completionSaveError.value = false
  await nextTick()
  const element = board.value?.$el
  if (element instanceof HTMLElement) element.querySelector<HTMLButtonElement>('.puzzle-piece')?.focus()
})

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
  const target = pieceAtPoint(event.clientX, event.clientY)
  drag.target = target ? Number(target.dataset.slot) : null
}

function finishDrag(event: PointerEvent) {
  const drag = dragging.value
  if (!drag || drag.pointerId !== event.pointerId) return
  if (drag.moved) {
    const target = pieceAtPoint(event.clientX, event.clientY)
    const targetSlot = target ? Number(target.dataset.slot) : null
    if (targetSlot !== null && targetSlot !== drag.from) swap(drag.from, targetSlot)
    ignoreClick.value = true
    if (ignoreClickTimer) clearTimeout(ignoreClickTimer)
    ignoreClickTimer = setTimeout(() => { ignoreClick.value = false }, 0)
  }
  dragging.value = null
}

function pieceAtPoint(x: number, y: number) {
  const target = document.elementFromPoint(x, y)?.closest<HTMLButtonElement>('.puzzle-piece')
  const element = board.value?.$el
  return target && element instanceof HTMLElement && element.contains(target) ? target : null
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
  if (import.meta.client) document.querySelector('.site-shell')?.removeAttribute('inert')
})
</script>
