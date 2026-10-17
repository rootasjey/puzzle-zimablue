export type PuzzleMove = [number, number]

const MOVE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const MAX_ATTEMPT_GENERATION = 2_000
const MAX_ATTEMPT_MOVES = 2_500

/** Recreates the player's starting board, including the no-repeat shuffle rule. */
export function createPuzzleOrder(date: string, gridSize: number, generation: number): number[] {
  let previous: number[] | undefined

  for (let boardGeneration = 0; boardGeneration <= generation; boardGeneration++) {
    const pieces = Array.from({ length: gridSize ** 2 }, (_, index) => index)
    let seed = [...date].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7)
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

/** Packs a generation and pairwise swaps into a short URL-safe token. */
export function encodePuzzleAttempt(generation: number, moves: readonly PuzzleMove[]): string {
  const packedMoves = moves.map(([first, second]) => `${MOVE_ALPHABET[first] ?? ''}${MOVE_ALPHABET[second] ?? ''}`).join('')
  return `${generation.toString(36)}.${packedMoves}`
}

/** Returns the verified move count, or null when the transcript is invalid. */
export function verifyPuzzleAttempt(date: string, gridSize: number, attempt: unknown): number | null {
  if (typeof attempt !== 'string' || attempt.length > MAX_ATTEMPT_MOVES * 2 + 5) return null
  const separator = attempt.indexOf('.')
  if (separator < 1 || attempt.indexOf('.', separator + 1) !== -1) return null

  const generationText = attempt.slice(0, separator)
  if (!/^[0-9a-z]{1,3}$/.test(generationText)) return null
  const generation = Number.parseInt(generationText, 36)
  if (!Number.isInteger(generation) || generation < 0 || generation > MAX_ATTEMPT_GENERATION) return null

  const packedMoves = attempt.slice(separator + 1)
  if (!packedMoves.length || packedMoves.length % 2 !== 0 || packedMoves.length > MAX_ATTEMPT_MOVES * 2) return null

  const order = createPuzzleOrder(date, gridSize, generation)
  if (order.length < 2 || order.length > MOVE_ALPHABET.length) return null
  for (let index = 0; index < packedMoves.length; index += 2) {
    const first = MOVE_ALPHABET.indexOf(packedMoves[index]!)
    const second = MOVE_ALPHABET.indexOf(packedMoves[index + 1]!)
    if (first < 0 || second < 0 || first >= order.length || second >= order.length || first === second) return null
    ;[order[first], order[second]] = [order[second]!, order[first]!]
  }

  return order.every((piece, slot) => piece === slot) ? packedMoves.length / 2 : null
}
