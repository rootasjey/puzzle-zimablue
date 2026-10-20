<template>
  <section class="game-panel" :aria-label="t('game.boardLabel')">
    <div v-if="!imageLoaded" class="board-loading">
      <BrandLoader v-if="!imageError" :label="t('game.loading')" />
      <span v-else role="alert">{{ t('game.imageError') }}</span>
    </div>
    <div
      v-else
      class="master-board-viewport"
      :class="{ 'is-master': masterMode, 'is-pan-mode': panMode, 'is-touch-gesture': touchGestureActive }"
      :style="masterViewportStyle"
      @pointerdown.capture="startPan"
      @pointermove.capture="movePan"
      @pointerup="finishPan"
      @pointercancel="finishPan"
      @lostpointercapture="finishPan"
    >
    <div class="master-board-transform" :style="masterTransformStyle">
    <TransitionGroup
      name="piece"
      tag="div"
      class="puzzle-board"
      ref="board"
      :style="boardStyle"
      role="group"
      :aria-label="t('game.gridLabel', { rows: puzzle.gridRows, columns: puzzle.gridColumns, title: displayedTitle })"
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
    </div>
    </div>
    <Teleport to="body">
      <Transition name="ghost-lift" appear>
        <div v-if="dragging?.moved" class="puzzle-drag-ghost" :class="{ settling: dragging.phase === 'settling', touch: dragging.pointerType === 'touch' }" :style="dragGhostStyle" aria-hidden="true">
          <div class="puzzle-drag-ghost-image" :style="[pieceStyle(dragging.piece), { '--image-url': `url('${puzzle.imageUrl}')`, '--grid-rows': puzzle.gridRows, '--grid-columns': puzzle.gridColumns } ]" />
        </div>
      </Transition>
    </Teleport>
    <div class="board-tools" :style="boardStyle">
      <div class="board-session-summary">
        <p v-if="complete" class="success-note" role="status">{{ t(moves === 1 ? 'game.successOne' : 'game.successMany', { count: moves }) }}</p>
        <p v-else class="move-count" aria-live="polite">{{ t(moves === 1 ? 'game.movesOne' : 'game.movesMany', { count: moves }) }}</p>
        <p v-if="moveLimitReached" class="move-limit-note" role="status">{{ t('game.moveLimitReached') }}</p>
        <p v-if="progressEnabled" class="session-save-status" :class="`is-${sessionStatus}`" role="status">{{ t(sessionStatusKey) }}</p>
        <p v-if="masterMode" class="master-attempt-status" :class="`is-${masterAttemptStatus}`" role="status">{{ t(masterStatusKey) }}</p>
        <p v-if="masterMode && masterAttemptStatus === 'guest'" class="master-login-prompt"><NuxtLink :to="signInLink">{{ t('master.signInBeforeMove') }}</NuxtLink></p>
        <p v-if="masterActionError" class="master-attempt-status is-error" role="alert">{{ masterActionError }}</p>
      </div>
      <div class="board-tool-actions">
        <div v-if="masterMode" class="master-zoom-tools" :aria-label="t('master.zoomControls')">
          <button type="button" :aria-label="t('master.zoomOut')" :disabled="masterZoom <= 1" @click="changeMasterZoom(-0.25)">−</button>
          <button type="button" :aria-label="t('master.fitBoard')" @click="fitMasterBoard">{{ t('master.fit') }}</button>
          <button type="button" :aria-label="t('master.zoomIn')" :disabled="masterZoom >= 3" @click="changeMasterZoom(0.25)">+</button>
          <button type="button" :disabled="masterZoom <= 1" :aria-pressed="panMode" :aria-label="t(panMode ? 'master.finishPan' : 'master.panBoard')" @click="panMode = !panMode">{{ t(panMode ? 'master.panDone' : 'master.pan') }}</button>
        </div>
        <p v-if="masterMode" class="master-touch-hint">{{ t('master.touchGestureHint') }}</p>
        <button v-if="masterMode && masterAttemptStatus === 'in_progress' && !complete" class="master-abandon-button" type="button" @click="abandonMasterAttempt">{{ t('master.abandon') }}</button>
        <NTooltip :delay-duration="250" :_tooltip-content="{ class: 'completion-action-tooltip' }">
          <button class="sound-toggle reference-toggle" type="button" :aria-pressed="showReferenceImage" :aria-label="t(showReferenceImage ? 'play.hideReference' : 'play.showReference')" @click="toggleReferenceImage">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
              <circle v-if="showReferenceImage" cx="12" cy="12" r="2.5" />
              <path v-else d="m4 4 16 16" />
            </svg>
          </button>
          <template #content>{{ t(showReferenceImage ? 'play.hideReference' : 'play.showReference') }}</template>
        </NTooltip>
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
          <button class="restart-icon-button" type="button" :aria-label="t('game.restart')" @click="requestRestart">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 0 0-12-4L5 10m-1 7v-5h5" /><path d="M5 12a7 7 0 0 0 12 4l2-2" /></svg>
          </button>
          <template #content>{{ t('game.restart') }}</template>
        </NTooltip>
      </div>
    </div>
    <Teleport to="body">
      <Transition name="completion">
        <section v-if="complete && completionOrigin" class="completion-screen" role="region" aria-labelledby="completion-title">
          <div class="completion-top-actions">
            <NuxtLink class="completion-home-link" :to="$localePath({ name: 'index' })">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7" /><path d="M5.5 9v12h13V9M9.5 21v-7h5v7" /></svg>
              <span>{{ t('game.home') }}</span>
            </NuxtLink>
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
          </div>
          <div class="completion-content">
            <div class="completion-board" :style="completionBoardStyle" aria-hidden="true">
              <div v-for="piece in order" :key="piece" class="completion-piece" :style="pieceStyle(piece)" />
            </div>
            <h2 id="completion-title" ref="completionHeading" class="completion-title" tabindex="-1">{{ t('game.congratulations') }}</h2>
            <div class="completion-result">
              <p class="completion-copy" role="status">{{ t(moves === 1 ? 'game.successOne' : 'game.successMany', { count: moves }) }}</p>
              <p v-if="masterMode" class="master-attempt-status" :class="`is-${masterAttemptStatus}`" role="status">{{ t(masterStatusKey) }}</p>
              <div v-if="puzzle.imageDescription" class="completion-art-description">
                <strong>{{ t('game.artDescription') }}</strong>
                <p>{{ puzzle.imageDescription }}</p>
              </div>
              <span v-if="completionSavePending && progressEnabled" class="completion-save-status" role="status">{{ t('game.savingScore') }}</span>
              <NuxtLink v-else-if="progressEnabled" class="completion-leaderboard-link" :to="leaderboardPath">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5v2a3 3 0 0 0 3 3m8-5h3v2a3 3 0 0 1-3 3m-4 1v4m-4 3h8m-7 0v-3h6v3" /></svg>
                <span>{{ t('leaderboard.puzzleLink') }}</span>
              </NuxtLink>
            </div>
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
            <div class="completion-navigation-actions" :class="{ 'is-reopened': reopenedCompletedPuzzle && !masterMode }">
              <button v-if="reopenedCompletedPuzzle && !masterMode" class="completion-replay-button" type="button" @click="requestRestart">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 0 0-12-4L5 10m-1 7v-5h5" /><path d="M5 12a7 7 0 0 0 12 4l2-2" /></svg>
                <span>{{ t('game.replayPuzzle') }}</span>
              </button>
              <NTooltip v-else :delay-duration="250" :_tooltip-content="{ class: 'completion-action-tooltip' }">
                <button class="restart-icon-button completion-restart" type="button" :aria-label="t('game.restart')" @click="requestRestart">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 0 0-12-4L5 10m-1 7v-5h5" /><path d="M5 12a7 7 0 0 0 12 4l2-2" /></svg>
                </button>
                <template #content>{{ t('game.restart') }}</template>
              </NTooltip>
              <NuxtLink v-if="!masterMode" :class="['completion-archive-link', reopenedCompletedPuzzle ? 'completion-archive-secondary-link' : 'play-link']" :to="$localePath({ name: 'archive' })">
                {{ t('game.chooseAnotherPuzzle') }}<span v-if="!reopenedCompletedPuzzle" aria-hidden="true"> ↗</span>
              </NuxtLink>
              <NuxtLink v-else class="play-link completion-archive-link" :to="$localePath({ name: 'index' })">
                {{ t('master.backHome') }} <span aria-hidden="true">↗</span>
              </NuxtLink>
            </div>
            <p v-if="!progressEnabled" class="completion-account-note" role="status">{{ t('game.previewNoProgress') }}</p>
            <div v-else-if="!loggedIn" class="completion-account-actions">
              <NuxtLink class="completion-account-link" :to="registerLink">{{ t('game.saveProgress') }}</NuxtLink>
              <span aria-hidden="true">·</span>
              <NuxtLink class="completion-login-link" :to="signInLink">{{ t('account.alreadyHaveAccount') }}</NuxtLink>
            </div>
            <p v-else-if="completionSaveError && progressEnabled" class="completion-account-note" role="status">{{ t('game.saveProgressError') }}</p>
          </div>
        </section>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { DailyPuzzle, WeeklyPuzzle } from '#shared/types/puzzle'
import type { MasterAttemptSnapshot, MasterAttemptStatus } from '#shared/types/master'
import type { LocalPuzzleSession, PuzzleSessionSnapshot } from '#shared/types/puzzle-session'
import { decodePuzzleAttempt, encodePuzzleAttempt } from '#shared/utils/puzzle-attempt'
import { createMasterGestureStart, updateMasterGesture } from '~/utils/master-gesture'
import { usePuzzleGame } from '~/composables/usePuzzleGame'

const props = withDefaults(defineProps<{ puzzle: DailyPuzzle | WeeklyPuzzle; progressEnabled?: boolean; masterMode?: boolean }>(), { progressEnabled: true, masterMode: false })
const accountPreferences = useAccountPreferences()
const showReferenceImage = computed(() => accountPreferences.preferences.value.showReferenceImage)
const { $getLocale, $t } = useI18n()
const t = (key: string, params?: Record<string, string | number>): string => String($t(key as any, params) ?? '')
const displayedTitle = computed(() => $getLocale() === 'en' && props.puzzle.titleEn ? props.puzzle.titleEn : props.puzzle.title)
const masterMode = computed(() => props.masterMode || props.puzzle.puzzleId.startsWith('master:'))
const puzzleDate = computed(() => 'date' in props.puzzle ? props.puzzle.date : '')
const weekKey = computed(() => 'weekKey' in props.puzzle ? props.puzzle.weekKey : '')
const { loggedIn } = useUserSession()
const { $localePath } = useNuxtApp()
const { enabled: soundEnabled, toggle: toggleSound, play: playSound } = usePuzzleSounds()

function toggleReferenceImage() {
  void accountPreferences.save({ showReferenceImage: !showReferenceImage.value })
}
const completionSaveError = ref(false)
const completionSavePending = ref(false)
const reopenedCompletedPuzzle = ref(false)
const shareFeedback = ref('')
const masterActionError = ref('')
const accountReturnQuery = computed(() => masterMode.value
  ? { returnTo: 'master' }
  : puzzleDate.value ? { puzzleDate: puzzleDate.value, attempt: attemptToken.value } : {})
const registerLink = computed(() => $localePath({ name: 'account-sign-up', query: accountReturnQuery.value }))
const signInLink = computed(() => $localePath({ name: 'account-sign-in', query: accountReturnQuery.value }))
const illustrationLink = computed(() => `https://zimablue.cc/illustrations/${encodeURIComponent(props.puzzle.imageSlug)}`)
const downloadLink = computed(() => puzzleDate.value ? `/api/puzzles/${encodeURIComponent(puzzleDate.value)}/download` : props.puzzle.imageUrl)
const downloadFilename = computed(() => `${props.puzzle.imageSlug || puzzleDate.value || weekKey.value}.jpg`)
const { order, selected, moves, moveHistory, attemptGeneration, complete, moveLimitReached, newBoard, restoreBoard, swap } = usePuzzleGame(props.puzzle)
const attemptLayout = computed(() => ({ puzzleId: props.puzzle.puzzleId, gridRows: props.puzzle.gridRows, gridColumns: props.puzzle.gridColumns }))
const attemptToken = computed(() => encodePuzzleAttempt(attemptLayout.value, attemptGeneration.value, moveHistory.value))
const leaderboardPath = computed(() => masterMode.value
  ? $localePath({ name: 'master-leaderboard-weekKey', params: { weekKey: weekKey.value } })
  : $localePath({ name: 'leaderboard-puzzle', params: { date: puzzleDate.value } }))
const masterAttemptStatus = ref<MasterAttemptStatus | 'guest' | 'claiming' | 'error'>('available')
const masterAttemptId = ref<string | null>(null)
const masterRankedGeneration = ref<number | null>(null)
const masterStatusKey = computed(() => ({
  available: 'master.rankAvailable',
  in_progress: 'master.rankInProgress',
  completed: 'master.rankUsed',
  forfeited: 'master.rankForfeited',
  practice: 'master.practiceMode',
  guest: 'master.guestMode',
  claiming: 'master.claimingAttempt',
  error: 'master.rankUnavailable',
}[masterAttemptStatus.value]))
const masterZoom = ref(1)
const panMode = ref(false)
const touchGestureActive = ref(false)
const masterPan = reactive({ x: 0, y: 0 })
const activeTouchPointers = new Map<number, { x: number; y: number }>()
let touchGestureStart: ReturnType<typeof createMasterGestureStart> | null = null
let panPointer: { id: number; x: number; y: number; originX: number; originY: number; moved: boolean } | null = null
let masterClaimPromise: Promise<void> | null = null
let masterSaveTimer: ReturnType<typeof setTimeout> | undefined
type SessionStatus = 'loading' | 'saving' | 'saved' | 'deviceSaved' | 'updated' | 'conflict' | 'error'
const sessionStatus = ref<SessionStatus>('loading')
const sessionStatusKey = computed(() => ({
  loading: 'game.sessionLoading',
  saving: 'game.sessionSaving',
  saved: 'game.sessionSaved',
  deviceSaved: 'game.sessionDeviceSaved',
  updated: 'game.sessionUpdated',
  conflict: 'game.sessionConflict',
  error: 'game.sessionError',
}[sessionStatus.value]))
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
let sessionSaveTimer: ReturnType<typeof setTimeout> | undefined
let sessionRetryTimer: ReturnType<typeof setTimeout> | undefined
let sessionPollTimer: ReturnType<typeof setInterval> | undefined
let sessionReady = false
let sessionSaveInFlight = false
let sessionRevision = 0
let lastServerAttempt = ''
let lastAppliedAttempt = ''
let latestLocalSaveAt = 0
let sessionRetryDelay = 2000

const localSessionKey = `puzzle-zimablue:session:${props.puzzle.puzzleId}`

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
  if (masterMode.value) {
    const maxWidth = Math.max(220, viewportSize.value.width - (viewportSize.value.width <= 760 ? 28 : 48))
    const heightBudget = viewportSize.value.height - (viewportSize.value.width <= 760 ? 460 : 360)
    return Math.min(920, maxWidth, Math.max(220, heightBudget))
  }
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
  '--grid-rows': props.puzzle.gridRows,
  '--grid-columns': props.puzzle.gridColumns,
  '--image-url': `url('${props.puzzle.imageUrl}')`,
  '--image-ratio': `${imageDimensions.value.width} / ${imageDimensions.value.height}`,
  '--board-max-width': `${boardMaxWidth.value}px`,
}))
const masterViewportStyle = computed(() => ({ '--master-stage-size': `${boardMaxWidth.value}px` }))
const masterTransformStyle = computed(() => masterMode.value ? {
  transform: `translate(${masterPan.x}px, ${masterPan.y}px) scale(${masterZoom.value})`,
} : {})
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

function readLocalSession(): LocalPuzzleSession | null {
  try {
    const value = window.localStorage.getItem(localSessionKey)
    if (!value) return null
    const parsed = JSON.parse(value) as Partial<LocalPuzzleSession>
    if (parsed.version !== 2 || parsed.puzzleId !== props.puzzle.puzzleId || parsed.gridRows !== props.puzzle.gridRows || parsed.gridColumns !== props.puzzle.gridColumns
      || typeof parsed.savedAt !== 'number' || typeof parsed.attempt !== 'string'
      || !decodePuzzleAttempt(attemptLayout.value, parsed.attempt)) return null
    return parsed as LocalPuzzleSession
  } catch {
    return null
  }
}

function writeLocalSession(attempt = attemptToken.value) {
  const savedAt = Date.now()
  latestLocalSaveAt = savedAt
  const snapshot: LocalPuzzleSession = {
    version: 2,
    puzzleId: props.puzzle.puzzleId,
    gridRows: props.puzzle.gridRows,
    gridColumns: props.puzzle.gridColumns,
    attempt,
    savedAt,
  }
  try {
    window.localStorage.setItem(localSessionKey, JSON.stringify(snapshot))
  } catch {
    // Local storage can be disabled or full; the account copy remains available when signed in.
  }
}

function applyAttempt(attempt: string): boolean {
  const decoded = decodePuzzleAttempt(attemptLayout.value, attempt)
  if (!decoded) return false
  dragging.value = null
  if (dragSettleTimer) clearTimeout(dragSettleTimer)
  lastAppliedAttempt = attempt
  restoreBoard(decoded.generation, decoded.moves)
  reopenedCompletedPuzzle.value = complete.value && !masterMode.value
  return true
}

function acceptRemoteSession(session: PuzzleSessionSnapshot, status: 'updated' | 'conflict') {
  if (sessionSaveTimer) clearTimeout(sessionSaveTimer)
  if (sessionRetryTimer) clearTimeout(sessionRetryTimer)
  sessionSaveTimer = undefined
  sessionRetryTimer = undefined
  sessionRevision = session.revision
  lastServerAttempt = session.attempt
  const decoded = decodePuzzleAttempt(attemptLayout.value, session.attempt)
  if (!decoded || !applyAttempt(session.attempt)) {
    sessionStatus.value = 'error'
    return
  }
  writeLocalSession(session.attempt)
  sessionStatus.value = status
  if (masterMode.value && masterAttemptStatus.value === 'in_progress' && decoded.generation !== masterRankedGeneration.value) void refreshMasterAttempt()
}

function scheduleSessionSave() {
  if (sessionSaveTimer) clearTimeout(sessionSaveTimer)
  if (sessionRetryTimer) clearTimeout(sessionRetryTimer)
  sessionRetryTimer = undefined
  sessionStatus.value = loggedIn.value ? 'saving' : 'deviceSaved'
  if (!loggedIn.value) return
  sessionSaveTimer = setTimeout(() => void saveSession(), 350)
}

function scheduleSessionRetry() {
  if (!loggedIn.value || !sessionReady || sessionRetryTimer) return
  const delay = sessionRetryDelay
  sessionRetryDelay = Math.min(sessionRetryDelay * 2, 30_000)
  sessionRetryTimer = setTimeout(() => {
    sessionRetryTimer = undefined
    void saveSession()
  }, delay)
}

async function saveSession() {
  if (!sessionReady || !props.progressEnabled || !loggedIn.value || sessionSaveInFlight) return
  if (sessionSaveTimer) clearTimeout(sessionSaveTimer)
  sessionSaveTimer = undefined
  const attempt = attemptToken.value
  if (attempt === lastServerAttempt && sessionRevision > 0) return

  sessionSaveInFlight = true
  sessionStatus.value = 'saving'
  try {
    const result = await $fetch<{ saved: boolean; session: PuzzleSessionSnapshot | null }>('/api/account/puzzle-session', {
      method: 'PUT',
      body: { puzzleId: props.puzzle.puzzleId, attempt, expectedRevision: sessionRevision },
    })
    if (!result.saved && result.session) {
      acceptRemoteSession(result.session, 'conflict')
      return
    }
    if (!result.session) throw new Error('The session save returned no revision.')
    sessionRevision = result.session.revision
    lastServerAttempt = attempt
    sessionRetryDelay = 2000
    if (sessionRetryTimer) clearTimeout(sessionRetryTimer)
    sessionRetryTimer = undefined
    writeLocalSession(attempt)
    sessionStatus.value = attemptToken.value === attempt ? 'saved' : 'saving'
  } catch {
    writeLocalSession(attempt)
    sessionStatus.value = 'error'
    scheduleSessionRetry()
  } finally {
    sessionSaveInFlight = false
    if (sessionReady && loggedIn.value && attemptToken.value !== lastServerAttempt) scheduleSessionSave()
  }
}

async function pollSession() {
  if (!sessionReady || !loggedIn.value || sessionSaveInFlight || document.visibilityState !== 'visible') return
  try {
    const result = await $fetch<{ session: PuzzleSessionSnapshot | null }>('/api/account/puzzle-session', {
      query: { puzzleId: props.puzzle.puzzleId },
    })
    if (result.session && result.session.revision > sessionRevision) {
      const localChanged = attemptToken.value !== lastServerAttempt
      acceptRemoteSession(result.session, localChanged ? 'conflict' : 'updated')
    } else if (attemptToken.value !== lastServerAttempt) {
      scheduleSessionRetry()
    }
  } catch {
    if (sessionStatus.value !== 'saving') sessionStatus.value = 'error'
  }
  if (masterMode.value) await refreshMasterAttempt()
}

function startSessionPolling() {
  if (sessionPollTimer) clearInterval(sessionPollTimer)
  if (!loggedIn.value || !props.progressEnabled) return
  sessionPollTimer = setInterval(() => {
    if (document.visibilityState === 'visible') void pollSession()
  }, 1800)
}

async function initializeSession(isLoggedIn = loggedIn.value) {
  if (!props.progressEnabled) {
    newBoard()
    if (masterMode.value) masterAttemptStatus.value = 'practice'
    sessionReady = true
    return
  }

  sessionReady = false
  sessionStatus.value = 'loading'
  if (sessionPollTimer) clearInterval(sessionPollTimer)
  if (sessionRetryTimer) clearTimeout(sessionRetryTimer)
  sessionRetryTimer = undefined
  sessionRevision = 0
  lastServerAttempt = ''

  if (isLoggedIn) {
    try {
      const result = await $fetch<{ session: PuzzleSessionSnapshot | null }>('/api/account/puzzle-session', {
        query: { puzzleId: props.puzzle.puzzleId },
      })
      if (result.session) {
        sessionRevision = result.session.revision
        lastServerAttempt = result.session.attempt
        if (!applyAttempt(result.session.attempt)) throw new Error('Invalid saved puzzle session.')
        writeLocalSession(result.session.attempt)
        sessionStatus.value = 'saved'
      } else {
        const local = readLocalSession()
        if (local) applyAttempt(local.attempt)
        else newBoard()
        sessionStatus.value = 'saving'
      }
      await initializeMasterAttempt()
      sessionReady = true
      startSessionPolling()
      if (!result.session) void saveSession()
      return
    } catch {
      const local = readLocalSession()
      if (local) applyAttempt(local.attempt)
      else newBoard()
      sessionStatus.value = 'error'
      await initializeMasterAttempt()
      sessionReady = true
      startSessionPolling()
      return
    }
  }

  const local = readLocalSession()
  if (local) {
    latestLocalSaveAt = local.savedAt
    applyAttempt(local.attempt)
  } else {
    newBoard()
  }
  sessionReady = true
  writeLocalSession()
  sessionStatus.value = 'deviceSaved'
  if (masterMode.value) masterAttemptStatus.value = moves.value ? 'practice' : 'guest'
}

async function initializeMasterAttempt() {
  if (!masterMode.value) return
  masterAttemptId.value = null
  masterRankedGeneration.value = null
  if (!loggedIn.value || !props.progressEnabled) {
    masterAttemptStatus.value = moves.value ? 'practice' : 'guest'
    return
  }
  try {
    const result = await $fetch<{ attempt: MasterAttemptSnapshot & { attempt?: string | null } }>(`/api/master/${encodeURIComponent(weekKey.value)}/attempt`)
    const saved = result.attempt
    if (saved.status === 'available') {
      masterAttemptStatus.value = moves.value ? 'practice' : 'available'
      return
    }
    if (saved.status === 'completed') {
      masterAttemptStatus.value = 'completed'
      return
    }
    if (saved.status === 'forfeited') {
      masterAttemptStatus.value = 'forfeited'
      return
    }
    masterAttemptId.value = saved.attemptId
    masterRankedGeneration.value = saved.generation
    const current = decodePuzzleAttempt(attemptLayout.value, attemptToken.value)
    const ranked = saved.attempt ? decodePuzzleAttempt(attemptLayout.value, saved.attempt) : null
    if (!ranked || ranked.generation !== saved.generation) {
      masterAttemptStatus.value = 'practice'
      return
    }
    if (!current || current.generation !== saved.generation || current.moves.length < ranked.moves.length) applyAttempt(saved.attempt!)
    else if (current.moves.length > ranked.moves.length) void saveMasterAttempt(attemptToken.value)
    masterAttemptStatus.value = 'in_progress'
  } catch {
    masterAttemptStatus.value = 'error'
  }
}

async function refreshMasterAttempt() {
  if (!masterMode.value || !loggedIn.value || !props.progressEnabled || masterClaimPromise) return
  try {
    const result = await $fetch<{ attempt: MasterAttemptSnapshot & { attempt?: string | null } }>(`/api/master/${encodeURIComponent(weekKey.value)}/attempt`)
    const saved = result.attempt
    if (saved.status === 'completed') {
      masterAttemptStatus.value = 'completed'
      return
    }
    if (saved.status === 'forfeited') {
      masterAttemptStatus.value = 'forfeited'
      return
    }
    if (saved.status === 'available') {
      if (masterAttemptStatus.value === 'error') masterAttemptStatus.value = moves.value ? 'practice' : 'available'
      return
    }
    if (saved.status !== 'in_progress') return

    masterAttemptId.value = saved.attemptId
    masterRankedGeneration.value = saved.generation
    const ranked = saved.attempt ? decodePuzzleAttempt(attemptLayout.value, saved.attempt) : null
    const current = decodePuzzleAttempt(attemptLayout.value, attemptToken.value)
    if (!ranked || ranked.generation !== saved.generation) {
      masterAttemptStatus.value = 'practice'
      return
    }
    if (!current || current.generation !== saved.generation || current.moves.length < ranked.moves.length) applyAttempt(saved.attempt!)
    else if (current.moves.length > ranked.moves.length) void saveMasterAttempt(attemptToken.value)
    masterAttemptStatus.value = 'in_progress'
  } catch {
    // Keep the current attempt status when a background check fails.
  }
}

async function claimMasterAttempt(attempt: string) {
  if (!masterMode.value || masterAttemptStatus.value !== 'available' || !loggedIn.value) return
  masterAttemptStatus.value = 'claiming'
  masterClaimPromise = (async () => {
    try {
      const result = await $fetch<{ ranked: boolean; attempt: MasterAttemptSnapshot }>(`/api/master/${encodeURIComponent(weekKey.value)}/attempt`, {
        method: 'POST',
        body: { attempt },
      })
      if (result.ranked && result.attempt.attemptId && result.attempt.generation === attemptGeneration.value) {
        masterAttemptId.value = result.attempt.attemptId
        masterRankedGeneration.value = result.attempt.generation
        masterAttemptStatus.value = 'in_progress'
        if (attemptToken.value !== attempt) void saveMasterAttempt(attemptToken.value)
      } else {
        masterAttemptStatus.value = 'practice'
      }
    } catch {
      masterAttemptStatus.value = 'error'
    } finally {
      masterClaimPromise = null
    }
  })()
  await masterClaimPromise
}

function scheduleMasterAttemptSave(attempt: string) {
  if (!masterAttemptId.value || masterAttemptStatus.value !== 'in_progress') return
  if (masterSaveTimer) clearTimeout(masterSaveTimer)
  masterSaveTimer = setTimeout(() => void saveMasterAttempt(attempt), 350)
}

async function saveMasterAttempt(attempt: string) {
  if (!masterAttemptId.value || masterAttemptStatus.value !== 'in_progress') return
  try {
    const result = await $fetch<{ ranked: boolean }>(`/api/master/${encodeURIComponent(weekKey.value)}/attempt`, {
      method: 'PUT',
      body: { attemptId: masterAttemptId.value, attempt },
    })
    if (!result.ranked && masterRankedGeneration.value !== attemptGeneration.value) masterAttemptStatus.value = 'practice'
  } catch {
    // The regular puzzle session is still saved; a failed ranked-attempt update cannot create a score.
  }
}

async function requestRestart() {
  if (masterClaimPromise) await masterClaimPromise
  if (masterMode.value && masterAttemptStatus.value === 'in_progress' && moves.value > 0) {
    if (!window.confirm(t('master.resetConfirm'))) return
    if (!await forfeitMasterAttempt()) return
  } else if (masterMode.value && masterAttemptStatus.value === 'completed' && moves.value > 0) {
    if (!window.confirm(t('master.resetCompletedConfirm'))) return
    masterAttemptStatus.value = 'practice'
  }
  reopenedCompletedPuzzle.value = false
  newBoard()
  fitMasterBoard()
}

async function abandonMasterAttempt() {
  if (masterClaimPromise) await masterClaimPromise
  if (masterAttemptStatus.value !== 'in_progress' || !window.confirm(t('master.abandonConfirm'))) return
  await forfeitMasterAttempt()
}

async function forfeitMasterAttempt(): Promise<boolean> {
  if (!masterAttemptId.value) return false
  masterActionError.value = ''
  try {
    await $fetch(`/api/master/${encodeURIComponent(weekKey.value)}/forfeit`, {
      method: 'POST',
      body: { attemptId: masterAttemptId.value },
    })
    masterAttemptStatus.value = 'forfeited'
    return true
  } catch {
    masterActionError.value = t('master.forfeitError')
    return false
  }
}

function shouldConfirmMasterLeave() {
  return masterMode.value && !complete.value && moves.value > 0
    && (masterAttemptStatus.value === 'in_progress' || masterAttemptStatus.value === 'claiming')
}

function handleMasterBeforeUnload(event: BeforeUnloadEvent) {
  if (!shouldConfirmMasterLeave()) return
  event.preventDefault()
  event.returnValue = ''
}

onBeforeRouteLeave(() => !shouldConfirmMasterLeave() || window.confirm(t('master.leaveConfirm')))

function handleGuestStorage(event: StorageEvent) {
  if (loggedIn.value || event.key !== localSessionKey || !event.newValue) return
  try {
    const local = JSON.parse(event.newValue) as Partial<LocalPuzzleSession>
    if (local.version !== 2 || local.puzzleId !== props.puzzle.puzzleId || local.gridRows !== props.puzzle.gridRows || local.gridColumns !== props.puzzle.gridColumns
      || typeof local.savedAt !== 'number' || local.savedAt <= latestLocalSaveAt || typeof local.attempt !== 'string'
      || !decodePuzzleAttempt(attemptLayout.value, local.attempt)) return
    latestLocalSaveAt = local.savedAt
    if (applyAttempt(local.attempt)) sessionStatus.value = 'updated'
  } catch {
    // Ignore malformed data from another tab.
  }
}

function handleBrowserOnline() {
  if (sessionStatus.value === 'error' && loggedIn.value) scheduleSessionSave()
}

watch(attemptToken, (attempt) => {
  if (!sessionReady || !props.progressEnabled) return
  if (attempt === lastAppliedAttempt) {
    lastAppliedAttempt = ''
    return
  }
  writeLocalSession(attempt)
  scheduleSessionSave()
  if (masterMode.value) {
    if (masterAttemptStatus.value === 'available') void claimMasterAttempt(attempt)
    else if (masterAttemptStatus.value === 'guest') masterAttemptStatus.value = 'practice'
    else if (masterAttemptStatus.value === 'in_progress' && masterRankedGeneration.value === attemptGeneration.value) scheduleMasterAttemptSave(attempt)
  }
}, { flush: 'post' })

watch(loggedIn, (isLoggedIn) => {
  if (sessionReady && props.progressEnabled) void initializeSession(isLoggedIn)
})

watch(complete, async (isComplete) => {
  if (!import.meta.client) return
  document.querySelector('.site-shell')?.toggleAttribute('inert', isComplete)

  if (isComplete) {
    playSound('complete')
    if (masterMode.value) {
      if (masterClaimPromise) await masterClaimPromise
      if (loggedIn.value && props.progressEnabled && masterAttemptStatus.value === 'in_progress' && masterAttemptId.value) {
        void saveSession()
        completionSavePending.value = true
        try {
          await $fetch(`/api/master/${encodeURIComponent(weekKey.value)}/complete`, {
            method: 'POST',
            body: { attemptId: masterAttemptId.value, attempt: attemptToken.value },
          })
          masterAttemptStatus.value = 'completed'
        } catch {
          completionSaveError.value = true
        } finally {
          completionSavePending.value = false
        }
      }
    } else if (loggedIn.value && props.progressEnabled) {
      void saveSession()
      completionSavePending.value = true
      try {
        await $fetch('/api/account/progress', { method: 'POST', body: { puzzleDate: puzzleDate.value, attempt: attemptToken.value } })
      } catch {
        completionSaveError.value = true
      } finally {
        completionSavePending.value = false
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
  if (complete.value || panMode.value || touchGestureActive.value || event.button !== 0) return
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
  if (panMode.value) return
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

function changeMasterZoom(amount: number) {
  masterZoom.value = Math.min(3, Math.max(1, Math.round((masterZoom.value + amount) * 100) / 100))
  if (masterZoom.value === 1) {
    masterPan.x = 0
    masterPan.y = 0
    return
  }
  constrainMasterPan()
}

function fitMasterBoard() {
  masterZoom.value = 1
  masterPan.x = 0
  masterPan.y = 0
  panMode.value = false
}

function startPan(event: PointerEvent) {
  if (!masterMode.value || !(event.currentTarget instanceof HTMLElement)) return

  if (event.pointerType === 'touch') {
    activeTouchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (activeTouchPointers.size >= 2) {
      const [first, second] = [...activeTouchPointers.values()]
      if (!first || !second) return
      touchGestureStart = createMasterGestureStart(first, second, masterZoom.value, masterPan.x, masterPan.y)
      touchGestureActive.value = true
      panPointer = null
      if (dragging.value?.phase === 'dragging') dragging.value = null
      suppressPieceClick()
      event.preventDefault()
      return
    }
    if (panMode.value) beginPan(event, event.currentTarget)
    return
  }

  if (!panMode.value || event.button !== 0) return
  beginPan(event, event.currentTarget)
}

function movePan(event: PointerEvent) {
  if (event.pointerType === 'touch') {
    const point = activeTouchPointers.get(event.pointerId)
    if (!point) return
    point.x = event.clientX
    point.y = event.clientY

    if (touchGestureActive.value && touchGestureStart && activeTouchPointers.size >= 2) {
      const [first, second] = [...activeTouchPointers.values()]
      if (!first || !second) return
      const transform = updateMasterGesture(touchGestureStart, first, second, {
        width: event.currentTarget instanceof HTMLElement ? event.currentTarget.clientWidth : boardMaxWidth.value,
        height: event.currentTarget instanceof HTMLElement ? event.currentTarget.clientHeight : boardMaxWidth.value,
      })
      masterZoom.value = transform.zoom
      masterPan.x = transform.panX
      masterPan.y = transform.panY
      event.preventDefault()
      return
    }
  }

  if (!panPointer || panPointer.id !== event.pointerId) return
  const deltaX = event.clientX - panPointer.x
  const deltaY = event.clientY - panPointer.y
  if (Math.abs(deltaX) + Math.abs(deltaY) > 5) panPointer.moved = true
  if (!panPointer.moved) return
  masterPan.x = panPointer.originX + deltaX
  masterPan.y = panPointer.originY + deltaY
  constrainMasterPan()
}

function finishPan(event: PointerEvent) {
  // Touch pointers use the browser's implicit pointer capture; their lost-capture
  // notification can also fire when pinch control is handed back to the browser.
  if (event.pointerType === 'touch') {
    if (event.type === 'lostpointercapture') return
    activeTouchPointers.delete(event.pointerId)
    if (touchGestureActive.value && activeTouchPointers.size < 2) {
      touchGestureActive.value = false
      touchGestureStart = null
      suppressPieceClick()
    }
  }

  if (panPointer?.id === event.pointerId) {
    if (panPointer.moved) suppressPieceClick()
    panPointer = null
  }
}

function beginPan(event: PointerEvent, viewport: HTMLElement) {
  if (event.pointerType !== 'touch') viewport.setPointerCapture(event.pointerId)
  panPointer = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    originX: masterPan.x,
    originY: masterPan.y,
    moved: false,
  }
}

function constrainMasterPan() {
  const viewport = document.querySelector<HTMLElement>('.master-board-viewport.is-master')
  const width = viewport?.clientWidth ?? boardMaxWidth.value
  const height = viewport?.clientHeight ?? boardMaxWidth.value
  const maxX = width * (masterZoom.value - 1) / 2
  const maxY = height * (masterZoom.value - 1) / 2
  masterPan.x = Math.max(-maxX, Math.min(maxX, masterPan.x))
  masterPan.y = Math.max(-maxY, Math.min(maxY, masterPan.y))
}

function suppressPieceClick() {
  ignoreClick.value = true
  if (ignoreClickTimer) clearTimeout(ignoreClickTimer)
  ignoreClickTimer = setTimeout(() => { ignoreClick.value = false }, 0)
}

async function sharePuzzle() {
  if (!import.meta.client || !props.progressEnabled) return
  const puzzleRoute = masterMode.value
    ? $localePath({ name: 'master' })
    : $localePath({ name: 'play', params: { date: puzzleDate.value } })
  const url = new URL(puzzleRoute, window.location.origin).href
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
  const column = piece % props.puzzle.gridColumns
  const row = Math.floor(piece / props.puzzle.gridColumns)
  const lastColumn = (props.puzzle.gridColumns - 1) * 100
  const lastRow = (props.puzzle.gridRows - 1) * 100
  return {
    backgroundPosition: `${lastColumn ? column / (props.puzzle.gridColumns - 1) * 100 : 0}% ${lastRow ? row / (props.puzzle.gridRows - 1) * 100 : 0}%`,
  }
}

onMounted(async () => {
  updateViewportSize()
  window.addEventListener('beforeunload', handleMasterBeforeUnload)
  window.addEventListener('resize', updateViewportSize)
  window.addEventListener('storage', handleGuestStorage)
  window.addEventListener('online', handleBrowserOnline)
  document.addEventListener('visibilitychange', pollSession)
  const image = new Image()
  image.src = props.puzzle.imageUrl
  try {
    await image.decode()
    imageDimensions.value = { width: image.naturalWidth, height: image.naturalHeight }
    await initializeSession()
    imageLoaded.value = true
  } catch {
    imageError.value = true
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('resize', updateViewportSize)
    window.removeEventListener('beforeunload', handleMasterBeforeUnload)
    window.removeEventListener('storage', handleGuestStorage)
    window.removeEventListener('online', handleBrowserOnline)
    document.removeEventListener('visibilitychange', pollSession)
  }
  if (ignoreClickTimer) clearTimeout(ignoreClickTimer)
  if (dragSettleTimer) clearTimeout(dragSettleTimer)
  if (sessionSaveTimer) clearTimeout(sessionSaveTimer)
  if (sessionRetryTimer) clearTimeout(sessionRetryTimer)
  if (sessionPollTimer) clearInterval(sessionPollTimer)
  if (masterSaveTimer) clearTimeout(masterSaveTimer)
  if (import.meta.client) document.querySelector('.site-shell')?.removeAttribute('inert')
})
</script>

<style>
.completion-top-actions { position: fixed; z-index: 1001; top: max(1rem, env(safe-area-inset-top)); right: max(1rem, env(safe-area-inset-right)); display: flex; align-items: center; gap: .6rem; }
.completion-home-link { display: inline-flex; min-height: 2.5rem; align-items: center; gap: .4rem; padding: 0 .7rem; border: 2px solid var(--ink); background: var(--white); box-shadow: 2px 2px 0 var(--ink); color: var(--blue); font-size: .8rem; font-weight: 800; text-decoration: none; transition: transform .15s ease, box-shadow .15s ease, color .15s ease; }
.completion-home-link:hover { transform: translateY(-1px); color: var(--coral); }
.completion-home-link:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--ink); }
.completion-home-link:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.completion-home-link svg { width: 1rem; height: 1rem; flex: none; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
.completion-sound-toggle { position: static; width: 2.5rem; height: 2.5rem; box-shadow: 2px 2px 0 var(--ink); }
.reference-panel { display: grid; gap: .7rem; padding: .8rem; border: 2px solid var(--ink); background: var(--yellow); box-shadow: var(--shadow); }
.reference-label { color: var(--yellow-foreground); font-size: .75rem; font-weight: 800; }
.reference-panel img { display: block; width: 100%; aspect-ratio: 1; border: 2px solid var(--ink); object-fit: cover; background: var(--white); }
.board-loading { display: grid; place-items: center; width: 100%; max-width: 590px; aspect-ratio: 1; margin-inline: auto; border: 2px solid var(--ink); background: var(--yellow); color: var(--yellow-foreground); font-size: .88rem; font-weight: 700; }

@media (max-width: 760px) {
  .reference-panel { grid-template-columns: 1fr 96px; align-items: center; }
  .reference-label { grid-column: 1; }
  .reference-panel img { grid-column: 2; grid-row: 1 / span 2; width: 96px; height: 96px; }
  .reference-panel p { grid-column: 1; }
}

.master-board-viewport:not(.is-master) { display: contents; }
.master-board-transform { width: 100%; }
.master-board-viewport.is-master { display: grid; width: 100%; max-width: var(--master-stage-size, 900px); height: var(--master-stage-size, 900px); margin-inline: auto; place-items: center; overflow: hidden; border: 2px solid var(--ink); background: color-mix(in srgb, var(--ink) 5%, var(--paper)); touch-action: none; }
.master-board-viewport.is-master .master-board-transform { display: grid; height: 100%; place-items: center; transition: transform .12s ease-out; }
.master-board-viewport.is-pan-mode .master-board-transform, .master-board-viewport.is-touch-gesture .master-board-transform { transition: none; }
.master-board-viewport.is-pan-mode { cursor: grab; }
.master-board-viewport.is-pan-mode:active { cursor: grabbing; }
.puzzle-board { display: grid; grid-template-columns: repeat(var(--grid-columns), minmax(0,1fr)); grid-template-rows: repeat(var(--grid-rows), minmax(0,1fr)); width: min(100%, var(--board-max-width, 590px)); aspect-ratio: var(--image-ratio, 1); margin-inline: auto; gap: 3px; border: 2px solid var(--ink); background: var(--ink); touch-action: none; }
.master-zoom-tools { display: flex; align-items: center; gap: .28rem; }
.master-zoom-tools button { min-width: 2rem; min-height: 2rem; border: 1.5px solid var(--ink); background: var(--white); color: var(--blue); font: inherit; font-size: .75rem; font-weight: 800; cursor: pointer; }
.master-zoom-tools button[aria-pressed="true"] { background: var(--yellow); color: var(--yellow-foreground); }
.master-zoom-tools button:disabled { opacity: .45; cursor: not-allowed; }
.master-zoom-tools button:focus-visible { outline: 3px solid var(--coral); outline-offset: 2px; }
.master-touch-hint { display: none; }
@media (max-width: 760px) { .master-touch-hint { display: block; flex-basis: 100%; margin: 0; color: var(--muted); font-size: .66rem; line-height: 1.4; text-align: right; } }
.board-tools:has(.master-zoom-tools) { flex-wrap: wrap; align-items: flex-start; }
.board-tool-actions:has(.master-zoom-tools) { max-width: 100%; flex-wrap: wrap; justify-content: flex-end; }
.master-abandon-button { min-height: 2rem; border: 0; padding: .2rem .3rem; background: transparent; color: var(--coral); font: inherit; font-size: .7rem; font-weight: 750; text-decoration: underline; text-underline-offset: .18rem; cursor: pointer; }
.master-abandon-button:focus-visible { outline: 3px solid var(--coral); outline-offset: 2px; }
.master-attempt-status { margin: .15rem 0 0; color: var(--blue); font-size: .74rem; font-weight: 750; }
.master-attempt-status.is-practice, .master-attempt-status.is-guest { color: var(--muted); }
.master-attempt-status.is-error { color: var(--coral); }
.master-login-prompt { margin: 0; font-size: .75rem; }
.master-login-prompt a { color: var(--blue); font-weight: 750; text-underline-offset: .16rem; }
.master-attempt-status:has(+ .completion-leaderboard-link) { text-align: center; }
.puzzle-board .piece-move { transition: transform .34s cubic-bezier(.2,.8,.2,1); }
.completion-screen { position: fixed; z-index: 1000; inset: 0; display: grid; place-items: safe center; overflow: auto; padding: 1.25rem; background: var(--paper); }
.completion-content { display: grid; width: 100%; justify-items: center; gap: clamp(.75rem, 2.8vh, 1.25rem); }
.completion-board { display: grid; grid-template-columns: repeat(var(--grid-columns), minmax(0,1fr)); grid-template-rows: repeat(var(--grid-rows), minmax(0,1fr)); width: min(88vw, 48svh, 640px); aspect-ratio: var(--image-ratio, 1); gap: 3px; border: 2px solid var(--ink); background: var(--ink); box-shadow: 7px 7px 0 var(--yellow); transform-origin: center; }
.completion-piece { min-width: 0; min-height: 0; background-color: var(--line); background-image: var(--image-url); background-size: calc(var(--grid-columns) * 100%) calc(var(--grid-rows) * 100%); }
.completion-title { color: var(--blue); font-size: clamp(2rem, 5vw, 3rem); font-weight: 850; line-height: 1; text-align: center; }
.completion-result { display: grid; justify-items: center; gap: .4rem; }
.completion-copy { margin: 0; color: var(--muted); font-size: .9rem; font-weight: 650; text-align: center; }
.completion-art-description { display: grid; max-width: min(62ch, 88vw); gap: .25rem; margin: .2rem 0 0; color: var(--muted); font-size: .88rem; line-height: 1.65; text-align: center; }
.completion-art-description strong { color: var(--ink); font-size: .75rem; }
.completion-art-description p { margin: 0; }
.completion-actions { display: flex; max-width: 100%; flex-wrap: wrap; align-items: center; justify-content: center; gap: .8rem; }
.completion-action-icon { display: grid; width: 2.8rem; height: 2.8rem; place-items: center; border: 2px solid var(--ink); background: var(--white); box-shadow: 3px 3px 0 var(--ink); color: var(--blue); cursor: pointer; transition: transform .15s ease, box-shadow .15s ease, color .15s ease; }
.completion-action-icon:hover { transform: translateY(-2px); color: var(--coral); }
.completion-action-icon:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--ink); }
.completion-action-icon:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.completion-action-icon svg { width: 1.25rem; height: 1.25rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
.completion-action-tooltip { z-index: 1100 !important; padding: .35rem .55rem; border: 1px solid var(--ink); background: var(--ink) !important; color: var(--paper) !important; font-size: .75rem; font-weight: 700; box-shadow: 2px 2px 0 var(--yellow); }
.completion-share-feedback { margin: -.35rem 0 0; color: var(--success-foreground); font-size: .78rem; font-weight: 700; text-align: center; }
.completion-account-note { max-width: 34ch; margin: -.2rem 0 0; color: var(--success-foreground); font-size: .84rem; font-weight: 700; line-height: 1.5; text-align: center; }
.completion-account-actions { display: flex; max-width: 100%; flex-wrap: wrap; align-items: center; justify-content: center; gap: .3rem .55rem; color: var(--muted); font-size: .78rem; }
.completion-navigation-actions { display: flex; max-width: 100%; flex-wrap: wrap; align-items: center; justify-content: center; gap: .7rem; }
.completion-navigation-actions.is-reopened { flex-direction: column; gap: .45rem; }
.completion-archive-link { min-height: 2.7rem; margin: 0; }
.completion-replay-button { display: inline-flex; min-height: 3.1rem; align-items: center; justify-content: center; gap: .65rem; margin: 0; padding: .55rem 1.2rem; border: 2px solid var(--ink); background: var(--blue); box-shadow: var(--shadow); color: var(--blue-foreground); font: inherit; font-size: .87rem; font-weight: 800; cursor: pointer; transition: transform .16s ease, box-shadow .16s ease; }
.completion-replay-button:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--ink); }
.completion-replay-button:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--ink); }
.completion-replay-button:focus-visible { outline: 3px solid var(--coral); outline-offset: 4px; }
.completion-replay-button svg { width: 1.1rem; height: 1.1rem; flex: none; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
.completion-archive-secondary-link { min-height: auto; padding: .1rem .25rem; color: var(--muted); font-size: .76rem; font-weight: 650; text-decoration: underline; text-underline-offset: .2rem; }
.completion-archive-secondary-link:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.completion-leaderboard-link { display: inline-flex; align-items: center; gap: .35rem; color: var(--blue); font-size: .8rem; font-weight: 750; text-decoration-thickness: 1px; text-underline-offset: .2rem; }
.completion-leaderboard-link svg { width: 1rem; height: 1rem; flex: none; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
.completion-leaderboard-link:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.completion-save-status { color: var(--muted); font-size: .78rem; font-weight: 700; }
.completion-account-link, .completion-login-link { color: var(--blue); font-size: .8rem; font-weight: 750; text-decoration-thickness: 1px; text-underline-offset: .2rem; }
.completion-account-link:focus-visible, .completion-login-link:focus-visible { outline: 3px solid var(--coral); outline-offset: 3px; }
.completion-restart { width: 2.7rem; height: 2.7rem; flex: none; border: 2px solid var(--ink); border-radius: 0; box-shadow: 3px 3px 0 var(--ink); }
.completion-enter-active { transition: opacity .25s ease; }
.completion-leave-active { transition: opacity .16s ease-in; }
.completion-enter-active .completion-board { transition: transform .48s cubic-bezier(.16,1,.3,1); }
.completion-leave-active .completion-board { transition: transform .16s ease-in; }
.completion-enter-from .completion-board { transform: translate(var(--origin-x), var(--origin-y)) scale(var(--origin-scale)); }
.completion-leave-to .completion-board { transform: scale(.96); }
.completion-enter-active .completion-title, .completion-enter-active .completion-result, .completion-enter-active .completion-actions, .completion-enter-active .completion-share-feedback, .completion-enter-active .completion-restart, .completion-enter-active .completion-account-actions { transition: opacity .22s ease .14s, transform .24s cubic-bezier(.16,1,.3,1) .14s; }
.completion-leave-active .completion-title, .completion-leave-active .completion-result, .completion-leave-active .completion-actions, .completion-leave-active .completion-share-feedback, .completion-leave-active .completion-restart, .completion-leave-active .completion-account-actions { transition: opacity .1s ease-in; }
.completion-enter-from .completion-title, .completion-enter-from .completion-result, .completion-enter-from .completion-actions, .completion-enter-from .completion-share-feedback, .completion-enter-from .completion-restart, .completion-enter-from .completion-account-actions, .completion-leave-to .completion-title, .completion-leave-to .completion-result, .completion-leave-to .completion-actions, .completion-leave-to .completion-share-feedback, .completion-leave-to .completion-restart, .completion-leave-to .completion-account-actions { opacity: 0; transform: translateY(.4rem); }
.puzzle-piece { position: relative; min-width: 0; border: 0; padding: 0; background-color: var(--line); background-image: var(--image-url); background-size: calc(var(--grid-columns) * 100%) calc(var(--grid-rows) * 100%); cursor: grab; user-select: none; -webkit-user-drag: none; touch-action: none; transition: filter .12s ease, box-shadow .12s ease, transform .1s ease; }
.puzzle-piece:active { cursor: grabbing; }
.puzzle-piece:hover { filter: brightness(1.06); }
.puzzle-piece.is-placed::after { position: absolute; top: .3rem; right: .3rem; display: grid; width: 18px; height: 18px; place-items: center; border: 2px solid var(--ink); border-radius: 50%; outline: 2px solid var(--paper); background: var(--yellow); box-shadow: 0 1px 4px rgb(8 15 46 / 45%); color: var(--yellow-foreground); content: '✓'; font-size: 11px; font-weight: 900; line-height: 1; pointer-events: none; }
.puzzle-piece.is-selected { z-index: 1; box-shadow: inset 0 0 0 4px var(--yellow), 0 0 0 2px var(--coral); filter: brightness(1.08); }
.puzzle-piece.is-dragging { z-index: 3; cursor: grabbing; filter: brightness(1.1); pointer-events: none; transition: none; }
.puzzle-piece.is-dragging::before { position: absolute; inset: 5px; border: 2px dashed rgb(255 255 255 / 72%); content: ''; pointer-events: none; }
.puzzle-drag-ghost { position: fixed; z-index: 1000; overflow: hidden; border: 2px solid white; box-shadow: 0 8px 24px rgb(8 15 46 / 34%); opacity: .97; pointer-events: none; transform: scale(1.04) rotate(1deg); }
.puzzle-drag-ghost.touch { transform: translateY(-14px) scale(1.04) rotate(1deg); }
.puzzle-drag-ghost.settling { transition: left .34s cubic-bezier(.2,.8,.2,1), top .34s cubic-bezier(.2,.8,.2,1), transform .34s cubic-bezier(.2,.8,.2,1), box-shadow .34s ease; box-shadow: 0 2px 5px rgb(8 15 46 / 12%); transform: none; }
.puzzle-drag-ghost-image { width: 100%; height: 100%; background-image: var(--image-url); background-size: calc(var(--grid-columns) * 100%) calc(var(--grid-rows) * 100%); }
.puzzle-piece.is-drop-target { z-index: 2; box-shadow: inset 0 0 0 4px var(--coral), 0 0 0 2px var(--yellow); }
.puzzle-piece:focus-visible { z-index: 2; outline: 3px solid var(--yellow); outline-offset: -4px; }
button:not(.puzzle-piece):disabled:active { transform: none; box-shadow: none !important; }
@media (max-width: 600px) {
  .completion-board { width: min(82vw, 42svh, 420px); }
  .completion-actions { width: 100%; gap: .25rem .65rem; }
  .completion-navigation-actions { gap: .55rem; }
  .completion-archive-link { gap: .5rem; padding-inline: .7rem; font-size: .78rem; }
  .completion-replay-button { max-width: 100%; padding-inline: .85rem; font-size: .8rem; } }
@media (max-width: 470px) {
  .puzzle-board { gap: 2px; }
  .puzzle-piece.is-selected { box-shadow: inset 0 0 0 3px var(--yellow), 0 0 0 2px var(--coral); } }
@media (prefers-reduced-motion: reduce) {
  .puzzle-board .piece-move { transition: none !important; }
  .completion-enter-active .completion-board, .completion-leave-active .completion-board { transition: opacity .01ms linear !important; }
  .completion-enter-from .completion-board { transform: none; } }
</style>
