import { getRouterParam } from 'h3'
import { createMasterPuzzleId } from '#shared/utils/puzzle-attempt'
import { requirePuzzleSessionContext, validatePuzzleSessionAttempt } from '../../../utils/puzzle-session'
import { assertMasterWeekKey, getCurrentIsoWeekKey } from '../../../utils/weekly-puzzles'
import { mapWeeklyAttempt, type WeeklyAttemptRow } from '../../../utils/master-attempt'

export default defineEventHandler(async (event) => {
  const weekKey = assertMasterWeekKey(getRouterParam(event, 'weekKey'))
  const puzzleId = createMasterPuzzleId(weekKey)
  if (weekKey !== getCurrentIsoWeekKey()) throw createError({ statusCode: 409, statusMessage: 'Le classement de cette semaine est fermé.' })
  const body = await readBody<{ attempt?: unknown }>(event)
  const { user, database, puzzle } = await requirePuzzleSessionContext(event, puzzleId)
  const decoded = validatePuzzleSessionAttempt(puzzle, body?.attempt)
  if (!decoded || decoded.moves.length < 1) throw createError({ statusCode: 400, statusMessage: 'Le premier coup du Master est invalide.' })
  const now = new Date().toISOString()
  const attemptId = createOpaqueToken(16)
  await database.prepare(`INSERT OR IGNORE INTO weekly_puzzle_attempts (user_id, puzzle_id, attempt_id, generation, attempt, started_at)
    VALUES (?, ?, ?, ?, ?, ?)`).bind(user.id, puzzleId, attemptId, decoded.generation, String(body?.attempt), now).run()
  const row = await database.prepare(`SELECT attempt_id, generation, attempt, status, moves, started_at, completed_at
    FROM weekly_puzzle_attempts WHERE user_id = ? AND puzzle_id = ?`).bind(user.id, puzzleId).first<WeeklyAttemptRow>()
  if (!row) throw createError({ statusCode: 503, statusMessage: 'La tentative du Master n’a pas pu être enregistrée.' })
  return { ranked: row.status === 'in_progress' && row.generation === decoded.generation, attempt: mapWeeklyAttempt(row) }
})
