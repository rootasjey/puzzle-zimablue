import type { H3Event } from 'h3'
import { getDatabase } from './cloudflare'
import { getParisDate, getPuzzleByDate } from './puzzles'

interface LeaderboardRow {
  rank: number
  ordinal: number
  public_name: string
  public_profile_token: string | null
  moves: number
  completed_at: string
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

export async function getPuzzleLeaderboard(event: H3Event, date: string) {
  const puzzle = await getPuzzleByDate(event, date)
  if (!puzzle) return null

  const currentPuzzle = puzzle.date === getParisDate()
  const historicalProfileFilter = currentPuzzle ? '' : 'AND users.public_profile_token IS NOT NULL'
  const rows = await getDatabase(event).prepare(`SELECT
      RANK() OVER (ORDER BY completions.moves ASC) AS rank,
      ROW_NUMBER() OVER (ORDER BY completions.moves ASC, completions.completed_at ASC) AS ordinal,
      users.public_name, users.public_profile_token, completions.moves, completions.completed_at
    FROM puzzle_completions AS completions
    JOIN users ON users.id = completions.user_id
    WHERE completions.puzzle_date = ? AND completions.score_verified = 1
      AND users.public_name IS NOT NULL AND users.disabled_at IS NULL AND users.email_verified_at IS NOT NULL
      ${historicalProfileFilter}
    ORDER BY completions.moves ASC, completions.completed_at ASC`)
    .bind(puzzle.date)
    .all<LeaderboardRow>()

  const entries = (rows.results ?? []).map(row => ({
    rank: row.rank,
    ordinal: row.ordinal,
    publicName: row.public_name,
    publicProfileToken: row.public_profile_token,
    moves: row.moves,
  }))
  const sortedMoves = entries.map(entry => entry.moves).sort((left, right) => left - right)
  const middle = Math.floor(sortedMoves.length / 2)
  const medianMoves = sortedMoves.length
    ? roundOneDecimal(sortedMoves.length % 2
      ? sortedMoves[middle]!
      : (sortedMoves[middle - 1]! + sortedMoves[middle]!) / 2)
    : null

  return {
    scope: currentPuzzle ? 'daily' as const : 'historical' as const,
    puzzle: {
      date: puzzle.date,
      title: puzzle.title,
      titleEn: puzzle.titleEn,
      gridSize: puzzle.gridSize,
    },
    metrics: {
      participantCount: sortedMoves.length,
      averageMoves: sortedMoves.length ? roundOneDecimal(sortedMoves.reduce((sum, moves) => sum + moves, 0) / sortedMoves.length) : null,
      medianMoves,
      bestMoves: sortedMoves[0] ?? null,
      worstMoves: sortedMoves.at(-1) ?? null,
    },
    entries,
  }
}
