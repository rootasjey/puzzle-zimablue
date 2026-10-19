import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createDailyPuzzleId,
  createMasterPuzzleId,
  createPuzzleOrder,
  decodePuzzleAttempt,
  DAILY_PUZZLE_GRID_SIZES,
  encodePuzzleAttempt,
  isDailyPuzzleGridSize,
  isPuzzleId,
  verifyPuzzleAttempt,
} from '../shared/utils/puzzle-attempt.ts'

function createSolvedAttempt(layout) {
  const order = createPuzzleOrder(layout.puzzleId, layout.gridRows, layout.gridColumns, 7)
  const moves = []
  for (let slot = 0; slot < order.length; slot++) {
    if (order[slot] === slot) continue
    const other = order.indexOf(slot, slot + 1)
    assert.notEqual(other, -1)
    ;[order[slot], order[other]] = [order[other], order[slot]]
    moves.push([slot, other])
  }
  return { moves, attempt: encodePuzzleAttempt(layout, 7, moves) }
}

test('daily and Master puzzle IDs are stable and validated', () => {
  assert.equal(createDailyPuzzleId('2026-10-18'), 'daily:2026-10-18')
  assert.equal(createMasterPuzzleId('2026-w43'), 'master:2026-w43')
  assert.equal(isPuzzleId('daily:2026-02-30'), false)
  assert.equal(isPuzzleId('master:2026-w54'), false)
  assert.equal(isPuzzleId('master:2021-w53'), false)
  assert.equal(isPuzzleId('master:2020-w53'), true)
})

test('daily puzzle difficulties allow square grids from 3x3 through 8x8', () => {
  assert.deepEqual(DAILY_PUZZLE_GRID_SIZES, [3, 4, 5, 6, 7, 8])
  for (const size of DAILY_PUZZLE_GRID_SIZES) assert.equal(isDailyPuzzleGridSize(size), true)
  for (const value of [2, 9, 3.5, '8', null]) assert.equal(isDailyPuzzleGridSize(value), false)
})

test('v2 attempts round-trip the daily 3x3 layout', () => {
  const layout = { puzzleId: 'daily:2026-10-18', gridRows: 3, gridColumns: 3 }
  const { moves, attempt } = createSolvedAttempt(layout)
  const decoded = decodePuzzleAttempt(layout, attempt)
  const firstBoard = createPuzzleOrder(layout.puzzleId, layout.gridRows, layout.gridColumns, 0)

  assert.equal(attempt.startsWith('v2~daily:2026-10-18~3x3~7~'), true)
  assert.deepEqual(createPuzzleOrder(layout.puzzleId, layout.gridRows, layout.gridColumns, 0), firstBoard)
  assert.notDeepEqual(createPuzzleOrder(layout.puzzleId, layout.gridRows, layout.gridColumns, 1), firstBoard)
  assert.equal(decoded?.puzzleId, layout.puzzleId)
  assert.deepEqual(decoded?.moves, moves)
  assert.equal(decoded?.order.every((piece, slot) => piece === slot), true)
  assert.equal(verifyPuzzleAttempt(layout, attempt), moves.length)
})

test('v2 supports both sides of the old 64-piece boundary and the 1024-piece limit', () => {
  for (const layout of [
    { puzzleId: 'daily:2026-10-19', gridRows: 8, gridColumns: 8 },
    { puzzleId: 'master:2026-w43', gridRows: 10, gridColumns: 12 },
    { puzzleId: 'master:2026-w44', gridRows: 32, gridColumns: 32 },
  ]) {
    const { moves, attempt } = createSolvedAttempt(layout)
    const decoded = decodePuzzleAttempt(layout, attempt)
    assert.equal(decoded?.order.length, layout.gridRows * layout.gridColumns)
    assert.deepEqual(decoded?.moves, moves)
    assert.equal(verifyPuzzleAttempt(layout, attempt), moves.length)
    if (layout.gridRows * layout.gridColumns > 64) assert.equal(moves.some(([first, second]) => first >= 64 || second >= 64), true)
  }
})

test('v2 rejects attempts for a different puzzle, a changed layout, or malformed moves', () => {
  const layout = { puzzleId: 'master:2026-w43', gridRows: 10, gridColumns: 12 }
  const { attempt } = createSolvedAttempt(layout)
  assert.equal(decodePuzzleAttempt({ ...layout, puzzleId: 'master:2026-w44' }, attempt), null)
  assert.equal(decodePuzzleAttempt({ ...layout, gridRows: 12, gridColumns: 10 }, attempt), null)
  assert.equal(decodePuzzleAttempt(layout, attempt.replace(/^v2/, 'v1')), null)
  assert.equal(decodePuzzleAttempt(layout, `${attempt}!`), null)
  assert.equal(verifyPuzzleAttempt(layout, encodePuzzleAttempt(layout, 0, [])), null)
})

test('v2 bounds puzzle dimensions, move indices, and move counts', () => {
  assert.throws(() => createPuzzleOrder('master:2026-w43', 33, 32, 0), RangeError)
  assert.throws(() => createPuzzleOrder('master:2026-w43', 32, 32, 2001), RangeError)
  assert.throws(() => encodePuzzleAttempt({ puzzleId: 'master:2026-w43', gridRows: 10, gridColumns: 12 }, 0, [[0, 120]]), RangeError)
  assert.throws(() => encodePuzzleAttempt({ puzzleId: 'master:2026-w43', gridRows: 10, gridColumns: 12 }, 0, Array.from({ length: 2501 }, (_, i) => [i % 120, (i + 1) % 120])), RangeError)
})
