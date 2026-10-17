import type { DailyPuzzle } from '#shared/types/puzzle'
import { createPuzzleOrder, type PuzzleMove } from '#shared/utils/puzzle-attempt'

export function usePuzzleGame(puzzle: DailyPuzzle) {
  const order = ref<number[]>([])
  const selected = ref<number | null>(null)
  const moves = ref(0)
  const moveHistory = ref<PuzzleMove[]>([])
  const attemptGeneration = ref(0)
  const started = ref(false)
  let boardGeneration = 0

  const complete = computed(() => order.value.length > 0 && order.value.every((piece, slot) => piece === slot))

  function newBoard() {
    const generation = boardGeneration++
    attemptGeneration.value = generation
    order.value = createPuzzleOrder(puzzle.date, puzzle.gridSize, generation)
    selected.value = null
    moves.value = 0
    moveHistory.value = []
    started.value = true
  }

  function choose(slot: number) {
    if (complete.value) return
    if (selected.value === null) {
      selected.value = slot
      return
    }
    if (selected.value === slot) {
      selected.value = null
      return
    }
    swap(selected.value, slot)
    selected.value = null
  }

  function swap(first: number, second: number) {
    if (complete.value || first === second || first < 0 || second < 0 || first >= order.value.length || second >= order.value.length) return
    const next = [...order.value]
    ;[next[first], next[second]] = [next[second]!, next[first]!]
    order.value = next
    moveHistory.value.push([first, second])
    moves.value++
    selected.value = null
  }

  return { order, selected, moves, moveHistory, attemptGeneration, complete, started, newBoard, choose, swap }
}
