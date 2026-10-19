import { getRouterParam } from 'h3'
import { createMasterPuzzleId } from '#shared/utils/puzzle-attempt'
import { requirePuzzleSessionContext, validatePuzzleSessionAttempt } from '../../../utils/puzzle-session'
import { mapWeeklyAttempt, type WeeklyAttemptRow } from '../../../utils/master-attempt'
import { assertMasterWeekKey } from '../../../utils/weekly-puzzles'

export default defineEventHandler(async (event) => {
  const weekKey = assertMasterWeekKey(getRouterParam(event, 'weekKey'))
  const puzzleId = createMasterPuzzleId(weekKey)
  const body = await readBody<{ attemptId?: unknown; attempt?: unknown }>(event)
  if (typeof body?.attemptId !== 'string' || body.attemptId.length > 64) throw createError({ statusCode: 400, statusMessage: 'Tentative classée invalide.' })
  const { user, database, puzzle } = await requirePuzzleSessionContext(event, puzzleId)
  const decoded = validatePuzzleSessionAttempt(puzzle, body.attempt)
  if (!decoded) throw createError({ statusCode: 400, statusMessage: 'État du Master invalide.' })
  const updated = await database.prepare(`UPDATE weekly_puzzle_attempts SET attempt = ?
    WHERE user_id = ? AND puzzle_id = ? AND attempt_id = ? AND generation = ? AND status = 'in_progress'`)
    .bind(String(body.attempt), user.id, puzzleId, body.attemptId, decoded.generation).run()
  const row = await database.prepare(`SELECT attempt_id, generation, attempt, status, moves, started_at, completed_at
    FROM weekly_puzzle_attempts WHERE user_id = ? AND puzzle_id = ?`).bind(user.id, puzzleId).first<WeeklyAttemptRow>()
  return { ranked: updated.meta.changes > 0, attempt: row ? mapWeeklyAttempt(row) : null }
})
