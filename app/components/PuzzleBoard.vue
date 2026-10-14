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
      :style="boardStyle"
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
          'is-dragging': dragging?.piece === piece && dragging.moved,
          'is-drop-target': dragging?.moved && dragging.target === slot && dragging.from !== slot,
        }"
        :style="[pieceStyle(piece), dragStyle(piece)]"
        :data-slot="slot"
        type="button"
        :aria-label="t('game.pieceLabel', { piece: slot + 1, position: piece + 1, placed: piece === slot ? t('game.placed') : '' })"
        :aria-pressed="selected === slot"
        @pointerdown="startDrag(slot, $event)"
        @pointerup="finishDrag"
        @pointercancel="cancelDrag"
        @lostpointercapture="cancelDrag"
        @click="choosePiece(slot, $event)"
      />
    </TransitionGroup>
    <Teleport to="body">
      <Transition name="ghost-lift" appear>
        <div v-if="dragging?.moved" class="puzzle-drag-ghost" :class="{ settling: dragging.phase === 'settling', touch: dragging.pointerType === 'touch' }" :style="dragGhostStyle" aria-hidden="true">
          <div class="puzzle-drag-ghost-image" :style="[pieceStyle(dragging.piece), { '--image-url': `url('${puzzle.imageUrl}')`, '--grid-size': puzzle.gridSize } ]" />
        </div>
      </Transition>
    </Teleport>
    <div class="board-tools" :style="boardStyle">
      <p v-if="complete" class="success-note" role="status">{{ t(moves === 1 ? 'game.successOne' : 'game.successMany', { count: moves }) }}</p>
      <p v-else class="move-count" aria-live="polite">{{ t(moves === 1 ? 'game.movesOne' : 'game.movesMany', { count: moves }) }}</p>
      <div class="board-tool-actions">
        <NTooltip :delay-duration="250" :_tooltip-content="{ class: 'completion-action-tooltip' }">
          <button class="sound-toggle" type="button" :aria-pressed="soundEnabled" :aria-label="t(soundEnabled ? 'game.muteSounds' : 'game.enableSounds')" @click="toggleSound">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M11 5 6 9H3v6h3l5 4z" />
              <template v-if="soundEnabled">
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                <path d="M18.5 5.5a9 9 0 0 1 0 13" />
              </template>
              <template v-else>
                <path d="m16 9 5 6m0-6-5 6" />
              </template>
            </svg>
          </button>
          <template #content>{{ t(soundEnabled ? 'game.muteSounds' : 'game.enableSounds') }}</template>
        </NTooltip>
        <NTooltip :delay-duration="250" :_tooltip-content="{ class: 'completion-action-tooltip' }">
          <button class="restart-icon-button" type="button" :aria-label="t('game.restart')" @click="newBoard">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 0 0-12-4L5 10m-1 7v-5h5" /><path d="M5 12a7 7 0 0 0 12 4l2-2" /></svg>
          </button>
          <template #content>{{ t('game.restart') }}</template>
        </NTooltip>
      </div>
    </div>
    <Teleport to="body">
      <Transition name="completion">
        <section v-if="complete && completionOrigin" class="completion-screen" role="region" aria-labelledby="completion-title">
          <NTooltip :delay-duration="250" :_tooltip-content="{ class: 'completion-action-tooltip' }">
            <button class="sound-toggle completion-sound-toggle" type="button" :aria-pressed="soundEnabled" :aria-label="t(soundEnabled ? 'game.muteSounds' : 'game.enableSounds')" @click="toggleSound">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M11 5 6 9H3v6h3l5 4z" />
                <template v-if="soundEnabled">
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                </template>
                <template v-else>
                  <path d="m16 9 5 6m0-6-5 6" />
                </template>
              </svg>
            </button>
            <template #content>{{ t(soundEnabled ? 'game.muteSounds' : 'game.enableSounds') }}</template>
          </NTooltip>
          <div class="completion-content">
            <div class="completion-board" :style="completionBoardStyle" aria-hidden="true">
              <div v-for="piece in order" :key="piece" class="completion-piece" :style="pieceStyle(piece)" />
            </div>
            <h2 id="completion-title" ref="completionHeading" class="completion-title" tabindex="-1">{{ t('game.congratulations') }}</h2>
            <p class="completion-copy" role="status">{{ t(moves === 1 ? 'game.successOne' : 'game.successMany', { count: moves }) }}</p>
            <div v-if="progressEnabled" class="completion-actions">
              <NTooltip :delay-duration="250" :_tooltip-content="{ class: 'completion-action-tooltip' }">
                <button class="completion-action-icon" type="button" :aria-label="t('game.share')" @click="sharePuzzle">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.7 10.7 6.6-4.4m-6.6 7 6.6 4.2" /></svg>
                </button>
                <template #content>{{ t('game.share') }}</template>
              </NTooltip>
              <NTooltip :delay-duration="250" :_tooltip-content="{ class: 'completion-action-tooltip' }">
                <a class="completion-action-icon" :href="illustrationLink" target="_blank" rel="noreferrer" :aria-label="t('game.viewOriginal')">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6m-11 5L20 4" /><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" /></svg>
                </a>
                <template #content>{{ t('game.viewOriginal') }}</template>
              </NTooltip>
              <NTooltip :delay-duration="250" :_tooltip-content="{ class: 'completion-action-tooltip' }">
                <a class="completion-action-icon" :href="downloadLink" :download="downloadFilename" :aria-label="t('game.download')">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M5 17v3h14v-3" /></svg>
                </a>
                <template #content>{{ t('game.download') }}</template>
              </NTooltip>
            </div>
            <p v-if="shareFeedback" class="completion-share-feedback" role="status">{{ shareFeedback }}</p>
            <div class="completion-navigation-actions">
              <NTooltip :delay-duration="250" :_tooltip-content="{ class: 'completion-action-tooltip' }">
                <button class="restart-icon-button completion-restart" type="button" :aria-label="t('game.restart')" @click="newBoard">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 0 0-12-4L5 10m-1 7v-5h5" /><path d="M5 12a7 7 0 0 0 12 4l2-2" /></svg>
                </button>
                <template #content>{{ t('game.restart') }}</template>
              </NTooltip>
              <NuxtLink class="play-link completion-archive-link" :to="$localePath({ name: 'archive' })">
                {{ t('game.chooseAnotherPuzzle') }} <span aria-hidden="true">↗</span>
              </NuxtLink>
            </div>
            <p v-if="!progressEnabled" class="completion-account-note" role="status">{{ t('game.previewNoProgress') }}</p>
            <NuxtLink v-else-if="!loggedIn && progressEnabled" class="play-link completion-account-link" :to="registerLink">{{ t('game.saveProgress') }}</NuxtLink>
            <NuxtLink v-if="!loggedIn && progressEnabled" class="completion-login-link" :to="signInLink">{{ t('account.alreadyHaveAccount') }}</NuxtLink>
            <p v-else-if="completionSaveError && progressEnabled" class="completion-account-note" role="status">{{ t('game.saveProgressError') }}</p>
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

const props = withDefaults(defineProps<{ puzzle: DailyPuzzle; progressEnabled?: boolean }>(), { progressEnabled: true })
const { $getLocale, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const displayedTitle = computed(() => $getLocale() === 'en' && props.puzzle.titleEn ? props.puzzle.titleEn : props.puzzle.title)
const { loggedIn } = useUserSession()
const { $localePath } = useNuxtApp()
const { enabled: soundEnabled, toggle: toggleSound, play: playSound } = usePuzzleSounds()
const completionSaveError = ref(false)
const shareFeedback = ref('')
const registerLink = computed(() => $localePath({ name: 'account-sign-up', query: { puzzleDate: props.puzzle.date, moves: String(moves.value) } }))
const signInLink = computed(() => $localePath({ name: 'account-sign-in', query: { puzzleDate: props.puzzle.date, moves: String(moves.value) } }))
const illustrationLink = computed(() => `https://zimablue.cc/illustrations/${encodeURIComponent(props.puzzle.imageSlug)}`)
const downloadLink = computed(() => `/api/puzzles/${encodeURIComponent(props.puzzle.date)}/download`)
const downloadFilename = computed(() => `${props.puzzle.imageSlug || props.puzzle.date}.jpg`)
const { order, selected, moves, complete, started, newBoard, swap } = usePuzzleGame(props.puzzle)
const imageLoaded = ref(false)
const imageError = ref(false)
const imageDimensions = ref({ width: 1, height: 1 })
const viewportSize = ref({ width: 0, height: 0 })
const board = ref<ComponentPublicInstance | null>(null)
const completionHeading = ref<HTMLHeadingElement | null>(null)
const completionOrigin = ref<{ x: number; y: number; scale: number } | null>(null)
const dragging = ref<{ pointerId: number; pointerType: string; from: number; piece: number; startX: number; startY: number; x: number; y: number; width: number; height: number; grabX: number; grabY: number; moved: boolean; target: number | null; phase: 'dragging' | 'settling' } | null>(null)
const ignoreClick = ref(false)
let ignoreClickTimer: ReturnType<typeof setTimeout> | undefined
let dragSettleTimer: ReturnType<typeof setTimeout> | undefined

const dragGhostStyle = computed(() => {
  if (!dragging.value) return {}
  const drag = dragging.value
  return {
    left: `${drag.x - (drag.phase === 'settling' ? drag.width / 2 : drag.grabX)}px`,
    top: `${drag.y - (drag.phase === 'settling' ? drag.height / 2 : drag.grabY)}px`,
    width: `${drag.width}px`,
    height: `${drag.height}px`,
  }
})

const imageAspectRatio = computed(() => imageDimensions.value.width / imageDimensions.value.height)
const boardMaxWidth = computed(() => {
  const maxHeight = viewportSize.value.width <= 600 ? viewportSize.value.height * .58 : 590
  return Math.min(590, maxHeight * imageAspectRatio.value)
})
const completionBoardWidth = computed(() => {
  const { width, height } = viewportSize.value
  if (!width || !height) return 420
  const mobile = width <= 600
  const maxWidth = Math.min(mobile ? width * .82 : width * .88, 640)
  const maxHeight = height * (mobile ? .42 : .48)
  return Math.min(maxWidth, maxHeight * imageAspectRatio.value)
})
const boardStyle = computed(() => ({
  '--grid-size': props.puzzle.gridSize,
  '--image-url': `url('${props.puzzle.imageUrl}')`,
  '--image-ratio': `${imageDimensions.value.width} / ${imageDimensions.value.height}`,
  '--board-max-width': `${boardMaxWidth.value}px`,
}))
const completionBoardStyle = computed(() => completionOrigin.value ? {
  ...boardStyle.value,
  width: `${completionBoardWidth.value}px`,
  '--origin-x': `${completionOrigin.value.x}px`,
  '--origin-y': `${completionOrigin.value.y}px`,
  '--origin-scale': completionOrigin.value.scale,
} : {})

function updateViewportSize() {
  viewportSize.value = { width: window.innerWidth, height: window.innerHeight }
}

watch(complete, async (isComplete) => {
  if (!import.meta.client) return
  document.querySelector('.site-shell')?.toggleAttribute('inert', isComplete)

  if (isComplete) {
    playSound('complete')
    if (loggedIn.value && props.progressEnabled) {
      try {
        await $fetch('/api/account/progress', { method: 'POST', body: { puzzleDate: props.puzzle.date, moves: moves.value } })
      } catch {
        completionSaveError.value = true
      }
    }
    await nextTick()
    const element = board.value?.$el
    if (element instanceof HTMLElement) {
      const rect = element.getBoundingClientRect()
      const targetSize = completionBoardWidth.value
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
  completionSaveError.value = false
  await nextTick()
  const element = board.value?.$el
  if (element instanceof HTMLElement) element.querySelector<HTMLButtonElement>('.puzzle-piece')?.focus()
})

function startDrag(slot: number, event: PointerEvent) {
  if (complete.value || event.button !== 0) return
  const button = event.currentTarget
  if (!(button instanceof HTMLButtonElement)) return
  if (event.pointerType === 'mouse' && event.button !== 0) return
  const rect = button.getBoundingClientRect()
  const piece = order.value[slot]
  if (piece === undefined) return
  playSound('move')
  button.setPointerCapture(event.pointerId)
  dragging.value = {
    pointerId: event.pointerId,
    pointerType: event.pointerType,
    from: slot,
    piece,
    startX: event.clientX,
    startY: event.clientY,
    x: event.clientX,
    y: event.clientY,
    width: rect.width,
    height: rect.height,
    grabX: event.clientX - rect.left,
    grabY: event.clientY - rect.top,
    moved: false,
    target: null,
    phase: 'dragging',
  }
}

function movePiece(event: PointerEvent) {
  const drag = dragging.value
  if (!drag || drag.phase !== 'dragging' || drag.pointerId !== event.pointerId) return
  drag.x = event.clientX
  drag.y = event.clientY
  if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return
  drag.moved = true
  const target = pieceAtPoint(event.clientX, event.clientY)
  drag.target = target ? Number(target.dataset.slot) : null
}

function finishDrag(event: PointerEvent) {
  const drag = dragging.value
  if (!drag || drag.pointerId !== event.pointerId || drag.phase !== 'dragging') return
  if (drag.moved) {
    const target = pieceAtPoint(event.clientX, event.clientY)
    const targetSlot = target ? Number(target.dataset.slot) : null
    const settleElement = targetSlot !== null && targetSlot !== drag.from ? target : board.value?.$el?.querySelector(`[data-slot="${drag.from}"]`)
    const rect = settleElement instanceof HTMLElement ? settleElement.getBoundingClientRect() : null
    if (targetSlot !== null && targetSlot !== drag.from) swapWithFeedback(drag.from, targetSlot)
    dragging.value = {
      ...drag,
      phase: 'settling',
      x: rect ? rect.left + rect.width / 2 : event.clientX,
      y: rect ? rect.top + rect.height / 2 : event.clientY,
    }
    if (dragSettleTimer) clearTimeout(dragSettleTimer)
    dragSettleTimer = setTimeout(() => { dragging.value = null; dragSettleTimer = undefined }, 360)
    ignoreClick.value = true
    if (ignoreClickTimer) clearTimeout(ignoreClickTimer)
    ignoreClickTimer = setTimeout(() => { ignoreClick.value = false }, 0)
    return
  }
  dragging.value = null
}

function pieceAtPoint(x: number, y: number) {
  const target = document.elementFromPoint(x, y)?.closest<HTMLButtonElement>('.puzzle-piece')
  const element = board.value?.$el
  return target && element instanceof HTMLElement && element.contains(target) ? target : null
}

function cancelDrag() {
  if (dragging.value?.phase === 'settling') return
  dragging.value = null
}

function choosePiece(slot: number, event: MouseEvent) {
  if (ignoreClick.value) {
    ignoreClick.value = false
    if (ignoreClickTimer) clearTimeout(ignoreClickTimer)
    return
  }
  const first = selected.value
  if (first === null) {
    if (event.detail === 0) playSound('move')
    selected.value = slot
    return
  }
  if (first === slot) {
    selected.value = null
    return
  }
  swapWithFeedback(first, slot)
}

function swapWithFeedback(first: number, second: number) {
  const firstPiece = order.value[first]
  const secondPiece = order.value[second]
  if (firstPiece === undefined || secondPiece === undefined || first === second) return

  swap(first, second)
  if (complete.value) return
  playSound(firstPiece === second || secondPiece === first ? 'placed' : 'misplaced')
}

async function sharePuzzle() {
  if (!import.meta.client || !props.progressEnabled) return
  const url = new URL($localePath({ name: 'play', params: { date: props.puzzle.date } }), window.location.origin).href
  const shareData = {
    title: displayedTitle.value,
    text: t('game.shareMessage', { title: displayedTitle.value }),
    url,
  }

  try {
    if (navigator.share) {
      await navigator.share(shareData)
      return
    }
    await navigator.clipboard.writeText(url)
    shareFeedback.value = t('game.linkCopied')
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    try {
      await navigator.clipboard.writeText(url)
      shareFeedback.value = t('game.linkCopied')
    } catch {
      shareFeedback.value = t('game.shareError')
    }
  }
}

function dragStyle(piece: number) {
  const drag = dragging.value
  if (!drag || drag.piece !== piece || !drag.moved) return {}
  return { opacity: 0 }
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
  updateViewportSize()
  window.addEventListener('resize', updateViewportSize)
  const image = new Image()
  image.src = props.puzzle.imageUrl
  try {
    await image.decode()
    imageDimensions.value = { width: image.naturalWidth, height: image.naturalHeight }
    imageLoaded.value = true
    if (!started.value) newBoard()
  } catch {
    imageError.value = true
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) window.removeEventListener('resize', updateViewportSize)
  if (ignoreClickTimer) clearTimeout(ignoreClickTimer)
  if (dragSettleTimer) clearTimeout(dragSettleTimer)
  if (import.meta.client) document.querySelector('.site-shell')?.removeAttribute('inert')
})
</script>
