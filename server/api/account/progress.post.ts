import { getDatabase } from '../../utils/cloudflare'
import { requireSignedInUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireSignedInUser(event)
  const body = await readBody<{ puzzleDate?: unknown; moves?: unknown }>(event)
  if (typeof body?.puzzleDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.puzzleDate) || !Number.isInteger(body.moves) || Number(body.moves) < 0 || Number(body.moves) > 100_000) {
    throw createError({ statusCode: 400, statusMessage: 'Résultat de puzzle invalide.' })
  }
  const database = getDatabase(event)
  const activeUser = await database.prepare('SELECT id FROM users WHERE id = ? AND disabled_at IS NULL AND email_verified_at IS NOT NULL')
    .bind(user.id).first<{ id: string }>()
  if (!activeUser) {
    await clearUserSession(event)
    throw createError({ statusCode: 403, statusMessage: 'Session invalide.' })
  }
  const puzzle = await database.prepare("SELECT date FROM puzzles WHERE date = ? AND status = 'published'").bind(body.puzzleDate).first()
  if (!puzzle) throw createError({ statusCode: 404, statusMessage: 'Puzzle introuvable.' })
  await database.prepare('INSERT OR IGNORE INTO puzzle_completions (user_id, puzzle_date, moves, completed_at) VALUES (?, ?, ?, ?)')
    .bind(user.id, body.puzzleDate, Number(body.moves), new Date().toISOString())
    .run()
  return { ok: true }
})
