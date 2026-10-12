import type { DailyPuzzle } from '~/data/puzzles'

export function usePuzzleGame(puzzle: DailyPuzzle) {
  const order = ref<number[]>([])
  const selected = ref<number | null>(null)
  const moves = ref(0)
  const started = ref(false)

  const complete = computed(() => order.value.length > 0 && order.value.every((piece, slot) => piece === slot))

  function newBoard() {
    const pieces = Array.from({ length: puzzle.size ** 2 }, (_, index) => index)
    let seed = [...puzzle.date].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7)
    for (let i = pieces.length - 1; i > 0; i--) {
      seed = (seed * 1664525 + 1013904223) >>> 0
      const j = seed % (i + 1)
      ;[pieces[i], pieces[j]] = [pieces[j]!, pieces[i]!]
    }
    if (pieces.every((piece, index) => piece === index)) [pieces[0], pieces[1]] = [pieces[1]!, pieces[0]!]
    order.value = pieces
    selected.value = null
    moves.value = 0
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
    const next = [...order.value]
    ;[next[selected.value], next[slot]] = [next[slot]!, next[selected.value]!]
    order.value = next
    moves.value++
    selected.value = null
  }

  return { order, selected, moves, complete, started, newBoard, choose }
}
