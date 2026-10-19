import { getRouterParam } from 'h3'
import { getDatabase } from '../../../utils/cloudflare'
import { getParisDate } from '../../../utils/puzzles'
import { getWeeklyPuzzle } from '../../../utils/weekly-puzzles'

interface LeaderboardRow { rank: number; ordinal: number; public_name: string; public_profile_token: string | null; moves: number }

export default defineEventHandler(async (event) => {
  const weekKey = getRouterParam(event, 'weekKey') ?? ''
  const puzzle = await getWeeklyPuzzle(event, weekKey)
  if (!puzzle) throw createError({ statusCode: 404, statusMessage: 'Le Master de cette semaine n’est pas publié.' })
  const isCurrentWeek = puzzle.weekStart <= getParisDate() && getParisDate() < getNextWeekStart(puzzle.weekStart)
  const historicalProfileFilter = isCurrentWeek ? '' : 'AND users.public_profile_token IS NOT NULL'
  const result = await getDatabase(event).prepare(`SELECT
      RANK() OVER (ORDER BY attempts.moves ASC) AS rank,
      ROW_NUMBER() OVER (ORDER BY attempts.moves ASC, attempts.completed_at ASC) AS ordinal,
      users.public_name, users.public_profile_token, attempts.moves
    FROM weekly_puzzle_attempts AS attempts JOIN users ON users.id = attempts.user_id
    WHERE attempts.puzzle_id = ? AND attempts.status = 'completed'
      AND users.public_name IS NOT NULL AND users.disabled_at IS NULL AND users.email_verified_at IS NOT NULL
      ${historicalProfileFilter}
    ORDER BY attempts.moves ASC, attempts.completed_at ASC`).bind(puzzle.puzzleId).all<LeaderboardRow>()
  const entries = (result.results ?? []).map(row => ({ rank: row.rank, ordinal: row.ordinal, publicName: row.public_name, publicProfileToken: row.public_profile_token, moves: row.moves }))
  const moves = entries.map(entry => entry.moves).sort((a, b) => a - b)
  const middle = Math.floor(moves.length / 2)
  const averageMoves = moves.length ? round1(moves.reduce((sum, item) => sum + item, 0) / moves.length) : null
  const medianMoves = moves.length ? round1(moves.length % 2 ? moves[middle]! : (moves[middle - 1]! + moves[middle]!) / 2) : null
  return {
    puzzle: { puzzleId: puzzle.puzzleId, weekKey: puzzle.weekKey, weekStart: puzzle.weekStart, title: puzzle.title, titleEn: puzzle.titleEn, pieceCount: puzzle.pieceCount },
    metrics: { participantCount: entries.length, averageMoves, medianMoves, bestMoves: moves[0] ?? null, worstMoves: moves.at(-1) ?? null },
    entries,
  }
})

function getNextWeekStart(weekStart: string): string {
  const next = new Date(`${weekStart}T12:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 7)
  return next.toISOString().slice(0, 10)
}

function round1(value: number): number { return Math.round(value * 10) / 10 }
