import { getDatabase } from '../../utils/cloudflare'
import { getParisDate, getPuzzleByDate } from '../../utils/puzzles'

interface LeaderboardRow {
  rank: number
  ordinal: number
  public_name: string
  moves: number
}

export default defineEventHandler(async (event) => {
  const puzzle = await getPuzzleByDate(event, getParisDate())
  if (!puzzle) return { puzzle: null, entries: [] }

  const rows = await getDatabase(event).prepare(`SELECT RANK() OVER (ORDER BY completions.moves ASC) AS rank,
      ROW_NUMBER() OVER (ORDER BY completions.moves ASC, completions.completed_at ASC) AS ordinal,
      users.public_name, completions.moves
    FROM puzzle_completions AS completions
    JOIN users ON users.id = completions.user_id
    WHERE completions.puzzle_date = ? AND completions.score_verified = 1
      AND users.public_name IS NOT NULL AND users.disabled_at IS NULL AND users.email_verified_at IS NOT NULL
    ORDER BY completions.moves ASC, completions.completed_at ASC
    LIMIT 10`)
    .bind(puzzle.date)
    .all<LeaderboardRow>()

  return {
    puzzle: {
      date: puzzle.date,
      title: puzzle.title,
      titleEn: puzzle.titleEn,
      gridSize: puzzle.gridSize,
    },
    entries: (rows.results ?? []).map(row => ({ rank: row.rank, ordinal: row.ordinal, publicName: row.public_name, moves: row.moves })),
  }
})
