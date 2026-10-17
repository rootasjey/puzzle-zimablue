import { getDatabase } from '../../utils/cloudflare'
import { requireSignedInUser } from '../../utils/auth'
import { verifyPuzzleAttempt } from '#shared/utils/puzzle-attempt'

export default defineEventHandler(async (event) => {
  const user = await requireSignedInUser(event)
  const body = await readBody<{ puzzleDate?: unknown; attempt?: unknown }>(event)
  if (typeof body?.puzzleDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.puzzleDate)) {
    throw createError({ statusCode: 400, statusMessage: 'Résultat de puzzle invalide.' })
  }
  const database = getDatabase(event)
  const activeUser = await database.prepare('SELECT id FROM users WHERE id = ? AND disabled_at IS NULL AND email_verified_at IS NOT NULL')
    .bind(user.id).first<{ id: string }>()
  if (!activeUser) {
    await clearUserSession(event)
    throw createError({ statusCode: 403, statusMessage: 'Session invalide.' })
  }
  const puzzle = await database.prepare("SELECT date, grid_size FROM puzzles WHERE date = ? AND status = 'published'")
    .bind(body.puzzleDate)
    .first<{ date: string; grid_size: number }>()
  if (!puzzle) throw createError({ statusCode: 404, statusMessage: 'Puzzle introuvable.' })
  const moves = verifyPuzzleAttempt(body.puzzleDate, puzzle.grid_size, body.attempt)
  if (moves === null) throw createError({ statusCode: 400, statusMessage: 'Résultat de puzzle invalide.' })

  const completedAt = new Date().toISOString()
  await database.prepare(`INSERT INTO puzzle_completions (user_id, puzzle_date, moves, completed_at, score_verified)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT (user_id, puzzle_date) DO UPDATE SET moves = excluded.moves, completed_at = excluded.completed_at, score_verified = 1
    WHERE puzzle_completions.score_verified = 0`)
    .bind(user.id, body.puzzleDate, moves, completedAt)
    .run()
  return { ok: true }
})
