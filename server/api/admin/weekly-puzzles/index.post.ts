import { requireAdmin } from '../../../utils/auth'
import { getDatabase } from '../../../utils/cloudflare'
import { getParisDate } from '../../../utils/puzzles'
import { validateWeeklyPuzzleInput } from '../../../utils/weekly-puzzles'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody<Record<string, unknown>>(event)
  const puzzle = validateWeeklyPuzzleInput(body ?? {})
  const database = getDatabase(event)
  const existing = await database.prepare('SELECT week_start, status FROM weekly_puzzles WHERE week_key = ?')
    .bind(puzzle.weekKey)
    .first<{ week_start: string; status: 'draft' | 'published' }>()
  if (existing?.status === 'published' && existing.week_start <= getParisDate()) {
    throw createError({ statusCode: 409, statusMessage: 'Un Master publié ne peut plus être modifié après le début de sa semaine.' })
  }
  const now = new Date().toISOString()
  await database.prepare(`INSERT INTO weekly_puzzles
    (puzzle_id, week_key, week_start, title, note, title_en, note_en, image_name, image_slug, image_url,
      image_description, grid_rows, grid_columns, status, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(week_key) DO UPDATE SET
      title = excluded.title, note = excluded.note, title_en = excluded.title_en, note_en = excluded.note_en,
      image_name = excluded.image_name, image_slug = excluded.image_slug, image_url = excluded.image_url,
      image_description = excluded.image_description, grid_rows = excluded.grid_rows,
      grid_columns = excluded.grid_columns, status = excluded.status, updated_at = excluded.updated_at`)
    .bind(puzzle.puzzleId, puzzle.weekKey, puzzle.weekStart, puzzle.title, puzzle.note, puzzle.titleEn, puzzle.noteEn,
      puzzle.imageName, puzzle.imageSlug, puzzle.imageUrl, puzzle.imageDescription, puzzle.gridRows, puzzle.gridColumns,
      puzzle.status, admin.id, now, now)
    .run()
  return puzzle
})
