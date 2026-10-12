import { getDatabase } from '../../../utils/cloudflare'
import { requireAdmin } from '../../../utils/auth'
import { validatePuzzleInput } from '../../../utils/validate-puzzle'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody<PuzzleInput>(event)
  const puzzle = validatePuzzleInput(body)
  const now = new Date().toISOString()
  try {
    await getDatabase(event).prepare(`INSERT INTO puzzles
      (date, title, note, title_en, note_en, image_name, image_slug, image_url, grid_size, status, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(puzzle.date, puzzle.title, puzzle.note, puzzle.titleEn, puzzle.noteEn, puzzle.imageName, puzzle.imageSlug, puzzle.imageUrl, puzzle.gridSize, puzzle.status, admin.id, now, now)
      .run()
  } catch {
    throw createError({ statusCode: 409, statusMessage: 'Un puzzle existe déjà à cette date.' })
  }
  return puzzle
})
