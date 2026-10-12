import { getDatabase } from '../../../utils/cloudflare'
import { requireAdmin } from '../../../utils/auth'
import { isIsoDate } from '../../../utils/puzzles'
import { validatePuzzleInput } from '../../../utils/validate-puzzle'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const originalDate = getRouterParam(event, 'date') ?? ''
  if (!isIsoDate(originalDate)) throw createError({ statusCode: 400, statusMessage: 'Date invalide.' })
  const puzzle = validatePuzzleInput(await readBody(event))
  try {
    const result = await getDatabase(event).prepare(`UPDATE puzzles SET
      date = ?, title = ?, note = ?, image_name = ?, image_slug = ?, image_url = ?, grid_size = ?, status = ?, updated_at = ?
      WHERE date = ?`)
      .bind(puzzle.date, puzzle.title, puzzle.note, puzzle.imageName, puzzle.imageSlug, puzzle.imageUrl, puzzle.gridSize, puzzle.status, new Date().toISOString(), originalDate)
      .run()
    if (result.meta.changes !== 1) throw createError({ statusCode: 404, statusMessage: 'Puzzle introuvable.' })
  } catch (error) {
    if (typeof error === 'object' && error && 'statusCode' in error) throw error
    throw createError({ statusCode: 409, statusMessage: 'Cette date est déjà occupée par un autre puzzle.' })
  }
  void admin
  return puzzle
})
