import { getRouterParam } from 'h3'
import { createMasterPuzzleId, verifyPuzzleAttempt } from '#shared/utils/puzzle-attempt'
import { requirePuzzleSessionContext } from '../../../utils/puzzle-session'
import { assertMasterWeekKey, getCurrentIsoWeekKey } from '../../../utils/weekly-puzzles'

interface AttemptRow { attempt_id: string; generation: number; attempt: string; status: 'in_progress' | 'completed' | 'forfeited'; moves: number | null }

export default defineEventHandler(async (event) => {
  const weekKey = assertMasterWeekKey(getRouterParam(event, 'weekKey'))
  const puzzleId = createMasterPuzzleId(weekKey)
  if (weekKey !== getCurrentIsoWeekKey()) throw createError({ statusCode: 409, statusMessage: 'Le classement de cette semaine est fermé.' })
  const body = await readBody<{ attemptId?: unknown; attempt?: unknown }>(event)
  if (typeof body?.attemptId !== 'string' || body.attemptId.length > 64) {
    throw createError({ statusCode: 400, statusMessage: 'Tentative classée invalide.' })
  }
  const { user, database, puzzle } = await requirePuzzleSessionContext(event, puzzleId)
  const attempt = await database.prepare(`SELECT attempt_id, generation, attempt, status, moves FROM weekly_puzzle_attempts
    WHERE user_id = ? AND puzzle_id = ?`).bind(user.id, puzzleId).first<AttemptRow>()
  if (!attempt || attempt.attempt_id !== body.attemptId) throw createError({ statusCode: 409, statusMessage: 'Aucune tentative classée n’est en cours.' })
  if (attempt.status === 'completed') return { ok: true, moves: attempt.moves }
  if (attempt.status !== 'in_progress') throw createError({ statusCode: 409, statusMessage: 'Cette tentative classée a été abandonnée.' })
  const moves = verifyPuzzleAttempt({ puzzleId, gridRows: puzzle.grid_rows, gridColumns: puzzle.grid_columns }, body.attempt)
  if (moves === null) throw createError({ statusCode: 400, statusMessage: 'Le résultat du Master est invalide.' })
  const decoded = validatePuzzleSessionAttempt(puzzle, body.attempt)
  if (!decoded || decoded.generation !== attempt.generation) throw createError({ statusCode: 409, statusMessage: 'Cette grille ne correspond pas à la tentative classée.' })
  const completedAt = new Date().toISOString()
  const result = await database.prepare(`UPDATE weekly_puzzle_attempts SET attempt = ?, status = 'completed', moves = ?, completed_at = ?
    WHERE user_id = ? AND puzzle_id = ? AND attempt_id = ? AND status = 'in_progress' AND generation = ?`)
    .bind(String(body.attempt), moves, completedAt, user.id, puzzleId, attempt.attempt_id, attempt.generation).run()
  if (result.meta.changes === 0) {
    const current = await database.prepare(`SELECT status, moves FROM weekly_puzzle_attempts WHERE user_id = ? AND puzzle_id = ?`)
      .bind(user.id, puzzleId).first<{ status: string; moves: number | null }>()
    if (current?.status !== 'completed') throw createError({ statusCode: 409, statusMessage: 'Cette tentative classée n’est plus disponible.' })
    return { ok: true, moves: current.moves }
  }
  return { ok: true, moves }
})
