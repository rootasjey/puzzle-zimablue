import type { D1Database } from './cloudflare'
import { getParisDate } from './puzzles'

export interface VerifiedDifficultyStats {
  gridRows: number
  gridColumns: number
  pieceCount: number
  completions: number
  averageMoves: number
  bestMoves: number
  worstMoves: number
}

interface DifficultyStatsRow {
  grid_rows: number
  grid_columns: number
  completions: number
  average_moves: number
  best_moves: number
  worst_moves: number
}

export async function getVerifiedPlayerStats(database: D1Database, userId: string) {
  const result = await database.prepare(`SELECT puzzles.grid_rows, puzzles.grid_columns,
      COUNT(*) AS completions,
      ROUND(AVG(puzzle_completions.moves), 1) AS average_moves,
      MIN(puzzle_completions.moves) AS best_moves,
      MAX(puzzle_completions.moves) AS worst_moves
    FROM puzzle_completions
    JOIN puzzles ON puzzles.date = puzzle_completions.puzzle_date
    WHERE puzzle_completions.user_id = ? AND puzzle_completions.score_verified = 1
      AND puzzles.status = 'published' AND puzzles.date <= ?
    GROUP BY puzzles.grid_rows, puzzles.grid_columns
    ORDER BY puzzles.grid_rows, puzzles.grid_columns`)
    .bind(userId, getParisDate())
    .all<DifficultyStatsRow>()

  const difficulties: VerifiedDifficultyStats[] = (result.results ?? []).map(row => ({
    gridRows: row.grid_rows,
    gridColumns: row.grid_columns,
    pieceCount: row.grid_rows * row.grid_columns,
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
