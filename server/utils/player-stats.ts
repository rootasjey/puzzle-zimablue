import type { D1Database } from './cloudflare'
import { getParisDate } from './puzzles'

export interface VerifiedDifficultyStats {
  gridSize: number
  pieceCount: number
  completions: number
  averageMoves: number
  bestMoves: number
  worstMoves: number
}

interface DifficultyStatsRow {
  grid_size: number
  completions: number
  average_moves: number
  best_moves: number
  worst_moves: number
}

export async function getVerifiedPlayerStats(database: D1Database, userId: string) {
  const result = await database.prepare(`SELECT puzzles.grid_size,
      COUNT(*) AS completions,
      ROUND(AVG(puzzle_completions.moves), 1) AS average_moves,
      MIN(puzzle_completions.moves) AS best_moves,
      MAX(puzzle_completions.moves) AS worst_moves
    FROM puzzle_completions
    JOIN puzzles ON puzzles.date = puzzle_completions.puzzle_date
    WHERE puzzle_completions.user_id = ? AND puzzle_completions.score_verified = 1
      AND puzzles.status = 'published' AND puzzles.date <= ?
    GROUP BY puzzles.grid_size
    ORDER BY puzzles.grid_size`)
    .bind(userId, getParisDate())
    .all<DifficultyStatsRow>()

  const difficulties: VerifiedDifficultyStats[] = (result.results ?? []).map(row => ({
    gridSize: row.grid_size,
    pieceCount: row.grid_size ** 2,
    completions: row.completions,
    averageMoves: row.average_moves,
    bestMoves: row.best_moves,
    worstMoves: row.worst_moves,
  }))

  return {
    completedCount: difficulties.reduce((sum, difficulty) => sum + difficulty.completions, 0),
    difficulties,
  }
}
