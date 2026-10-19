import { isValidIsoWeekKey } from './iso-week.ts'

export type PuzzleMove = [number, number]

export interface DecodedPuzzleAttempt {
  puzzleId: string
  gridRows: number
  gridColumns: number
  generation: number
  moves: PuzzleMove[]
  order: number[]
}

export interface PuzzleLayout {
  puzzleId: string
  gridRows: number
  gridColumns: number
}

const MOVE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const MAX_ATTEMPT_GENERATION = 2_000
export const MAX_ATTEMPT_MOVES = 2_500
const MAX_PUZZLE_ID_LENGTH = 64
export const MAX_PUZZLE_ROWS = 32
export const MAX_PUZZLE_COLUMNS = 32
export const MAX_PUZZLE_CELLS = 1_024
export const MAX_ATTEMPT_LENGTH = 10_080
export const DAILY_PUZZLE_GRID_SIZES = [3, 4, 5, 6, 7, 8] as const

export function isDailyPuzzleGridSize(value: unknown): value is typeof DAILY_PUZZLE_GRID_SIZES[number] {
  return typeof value === 'number' && DAILY_PUZZLE_GRID_SIZES.includes(value as typeof DAILY_PUZZLE_GRID_SIZES[number])
}

export function createDailyPuzzleId(date: string): string {
  if (!isValidDate(date)) throw new RangeError('Invalid daily puzzle date.')
  return `daily:${date}`
}

export function createMasterPuzzleId(weekKey: string): string {
  if (!isValidIsoWeekKey(weekKey)) throw new RangeError('Invalid master puzzle week key.')
  return `master:${weekKey}`
}

export function isPuzzleId(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > MAX_PUZZLE_ID_LENGTH) return false
  if (value.startsWith('daily:')) return isValidDate(value.slice('daily:'.length))
  return value.startsWith('master:') && isValidIsoWeekKey(value.slice('master:'.length))
}

export function isValidPuzzleLayout(layout: PuzzleLayout): boolean {
  return isPuzzleId(layout.puzzleId)
    && Number.isInteger(layout.gridRows) && layout.gridRows >= 2 && layout.gridRows <= MAX_PUZZLE_ROWS
    && Number.isInteger(layout.gridColumns) && layout.gridColumns >= 2 && layout.gridColumns <= MAX_PUZZLE_COLUMNS
    && layout.gridRows * layout.gridColumns <= MAX_PUZZLE_CELLS
}

/** Recreates the player's starting board, including the no-repeat shuffle rule. */
export function createPuzzleOrder(puzzleId: string, gridRows: number, gridColumns: number, generation: number): number[] {
  const layout = { puzzleId, gridRows, gridColumns }
  if (!isValidPuzzleLayout(layout) || !Number.isInteger(generation) || generation < 0 || generation > MAX_ATTEMPT_GENERATION) {
    throw new RangeError('Invalid puzzle attempt configuration.')
  }

  let previous: number[] | undefined
  for (let boardGeneration = 0; boardGeneration <= generation; boardGeneration++) {
    const pieces = Array.from({ length: gridRows * gridColumns }, (_, index) => index)
    let seed = [...puzzleId].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7)
    seed = (seed + Math.imul(gridRows, 0x85ebca6b) + Math.imul(gridColumns, 0xc2b2ae35)) >>> 0
    seed = (seed + Math.imul(boardGeneration, 0x9e3779b9)) >>> 0
    for (let i = pieces.length - 1; i > 0; i--) {
      seed = (seed * 1664525 + 1013904223) >>> 0
      const j = seed % (i + 1)
      ;[pieces[i], pieces[j]] = [pieces[j]!, pieces[i]!]
    }
    if (pieces.every((piece, index) => piece === index)) [pieces[0], pieces[1]] = [pieces[1]!, pieces[0]!]
    if (previous && pieces.every((piece, index) => piece === previous![index])) [pieces[0], pieces[1]] = [pieces[1]!, pieces[0]!]
    previous = pieces
  }

  return previous ?? []
}

/** Packs a puzzle identity, rectangular layout, generation, and pairwise swaps into a URL-safe v2 token. */
export function encodePuzzleAttempt(layout: PuzzleLayout, generation: number, moves: readonly PuzzleMove[]): string {
  if (!isValidPuzzleLayout(layout) || !Number.isInteger(generation) || generation < 0 || generation > MAX_ATTEMPT_GENERATION
    || moves.length > MAX_ATTEMPT_MOVES) {
    throw new RangeError('Invalid puzzle attempt configuration.')
  }

  const pieceCount = layout.gridRows * layout.gridColumns
  const indexWidth = getIndexWidth(pieceCount)
  const packedMoves = moves.map(([first, second]) => {
    if (!Number.isInteger(first) || !Number.isInteger(second) || first < 0 || second < 0
      || first >= pieceCount || second >= pieceCount || first === second) {
      throw new RangeError('Invalid puzzle move.')
    }
    return `${encodeIndex(first, indexWidth)}${encodeIndex(second, indexWidth)}`
  }).join('')

  return `v2~${layout.puzzleId}~${layout.gridRows}x${layout.gridColumns}~${generation.toString(36)}~${packedMoves}`
}

/** Decodes and replays a saved board state, including unfinished attempts. */
export function decodePuzzleAttempt(layout: PuzzleLayout, attempt: unknown): DecodedPuzzleAttempt | null {
  if (!isValidPuzzleLayout(layout) || typeof attempt !== 'string' || attempt.length > MAX_ATTEMPT_LENGTH) return null
  const parts = attempt.split('~')
  if (parts.length !== 5 || parts[0] !== 'v2' || parts[1] !== layout.puzzleId
    || parts[2] !== `${layout.gridRows}x${layout.gridColumns}`) return null

  const generationText = parts[3]!
  if (!/^[0-9a-z]{1,3}$/.test(generationText)) return null
  const generation = Number.parseInt(generationText, 36)
  if (!Number.isInteger(generation) || generation < 0 || generation > MAX_ATTEMPT_GENERATION) return null

  const packedMoves = parts[4]!
  const pieceCount = layout.gridRows * layout.gridColumns
  const indexWidth = getIndexWidth(pieceCount)
  const encodedMoveWidth = indexWidth * 2
  if (packedMoves.length % encodedMoveWidth !== 0 || packedMoves.length > MAX_ATTEMPT_MOVES * encodedMoveWidth) return null

  const order = createPuzzleOrder(layout.puzzleId, layout.gridRows, layout.gridColumns, generation)
  const moves: PuzzleMove[] = []
  for (let index = 0; index < packedMoves.length; index += encodedMoveWidth) {
    const first = decodeIndex(packedMoves.slice(index, index + indexWidth))
    const second = decodeIndex(packedMoves.slice(index + indexWidth, index + encodedMoveWidth))
    if (first === null || second === null || first >= order.length || second >= order.length || first === second) return null
    ;[order[first], order[second]] = [order[second]!, order[first]!]
    moves.push([first, second])
  }

  return { puzzleId: layout.puzzleId, gridRows: layout.gridRows, gridColumns: layout.gridColumns, generation, moves, order }
}

/** Returns the verified move count, or null when the transcript is invalid. */
export function verifyPuzzleAttempt(layout: PuzzleLayout, attempt: unknown): number | null {
  const decoded = decodePuzzleAttempt(layout, attempt)
  if (!decoded?.moves.length || !decoded.order.every((piece, slot) => piece === slot)) return null
  return decoded.moves.length
}

function getIndexWidth(pieceCount: number): number {
  return pieceCount <= MOVE_ALPHABET.length ? 1 : 2
}

function encodeIndex(value: number, width: number): string {
  let remainder = value
  let encoded = ''
  for (let place = width - 1; place >= 0; place--) {
    const divisor = MOVE_ALPHABET.length ** place
    encoded += MOVE_ALPHABET[Math.floor(remainder / divisor) % MOVE_ALPHABET.length]!
    remainder %= divisor
  }
  return encoded
}

function decodeIndex(value: string): number | null {
  let decoded = 0
  for (const char of value) {
    const digit = MOVE_ALPHABET.indexOf(char)
    if (digit < 0) return null
    decoded = decoded * MOVE_ALPHABET.length + digit
  }
  return decoded
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T12:00:00Z`))
    && new Date(`${value}T12:00:00Z`).toISOString().startsWith(value)
}
