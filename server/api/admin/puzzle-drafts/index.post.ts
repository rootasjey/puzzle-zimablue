import { getDatabase } from '../../../utils/cloudflare'
import { requireAdmin } from '../../../utils/auth'
import { validatePuzzleInput } from '../../../utils/validate-puzzle'
import { isIsoDate } from '../../../utils/puzzles'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody<Record<string, unknown>>(event)
  const puzzle = validatePuzzleInput({ ...body, status: 'draft' })
  const sourceDate = body.sourceDate === '' || body.sourceDate == null ? null : body.sourceDate
  const draftDate = typeof body.draftDate === 'string' && isIsoDate(body.draftDate) ? body.draftDate : null
  if (sourceDate !== null && (typeof sourceDate !== 'string' || !isIsoDate(sourceDate))) {
    throw createError({ statusCode: 400, statusMessage: 'Date source invalide.' })
  }
  const database = getDatabase(event)
  const [publishedConflict, draftConflict] = await Promise.all([
    database.prepare('SELECT date FROM puzzles WHERE date = ? AND date != ?').bind(puzzle.date, sourceDate ?? '').first(),
    database.prepare('SELECT date FROM puzzle_drafts WHERE date = ? AND date != ?').bind(puzzle.date, draftDate ?? '').first(),
  ])
  if (publishedConflict || draftConflict) {
    throw createError({ statusCode: 409, statusMessage: 'Cette date est déjà occupée par un autre puzzle.' })
  }
  const now = new Date().toISOString()
  const payload = JSON.stringify(puzzle)
  await database.prepare(`INSERT INTO puzzle_drafts (date, source_date, payload_json, created_by, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET source_date = excluded.source_date, payload_json = excluded.payload_json, updated_at = excluded.updated_at`)
    .bind(puzzle.date, sourceDate, payload, admin.id, now)
    .run()
  if (draftDate && draftDate !== puzzle.date) {
    await database.prepare('DELETE FROM puzzle_drafts WHERE date = ?').bind(draftDate).run()
  }
  return { ...puzzle, sourceDate }
})
