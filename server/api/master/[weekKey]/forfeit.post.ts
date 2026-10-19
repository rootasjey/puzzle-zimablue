import { getRouterParam } from 'h3'
import { createMasterPuzzleId } from '#shared/utils/puzzle-attempt'
import { assertMasterWeekKey } from '../../../utils/weekly-puzzles'
import { requirePuzzleSessionContext } from '../../../utils/puzzle-session'

export default defineEventHandler(async (event) => {
  const weekKey = assertMasterWeekKey(getRouterParam(event, 'weekKey'))
  const puzzleId = createMasterPuzzleId(weekKey)
  const body = await readBody<{ attemptId?: unknown }>(event)
  if (typeof body?.attemptId !== 'string' || body.attemptId.length > 64) throw createError({ statusCode: 400, statusMessage: 'Tentative classée invalide.' })
  const { user, database } = await requirePuzzleSessionContext(event, puzzleId)
  const result = await database.prepare(`UPDATE weekly_puzzle_attempts SET status = 'forfeited'
    WHERE user_id = ? AND puzzle_id = ? AND attempt_id = ? AND status = 'in_progress'`)
    .bind(user.id, puzzleId, body.attemptId).run()
  if (result.meta.changes > 0) return { forfeited: true }
  const row = await database.prepare('SELECT status FROM weekly_puzzle_attempts WHERE user_id = ? AND puzzle_id = ?')
    .bind(user.id, puzzleId).first<{ status: string }>()
  if (row?.status === 'forfeited') return { forfeited: true }
  throw createError({ statusCode: 409, statusMessage: 'Cette tentative classée ne peut plus être abandonnée.' })
})
