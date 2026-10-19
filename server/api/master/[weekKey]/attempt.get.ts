import { getRouterParam } from 'h3'
import { createMasterPuzzleId } from '#shared/utils/puzzle-attempt'
import { assertMasterWeekKey } from '../../../utils/weekly-puzzles'
import { requirePuzzleSessionContext } from '../../../utils/puzzle-session'
import { mapWeeklyAttempt, type WeeklyAttemptRow } from '../../../utils/master-attempt'

export default defineEventHandler(async (event) => {
  const weekKey = assertMasterWeekKey(getRouterParam(event, 'weekKey'))
  const puzzleId = createMasterPuzzleId(weekKey)
  const { user, database } = await requirePuzzleSessionContext(event, puzzleId)
  const row = await database.prepare(`SELECT attempt_id, generation, attempt, status, moves, started_at, completed_at
    FROM weekly_puzzle_attempts WHERE user_id = ? AND puzzle_id = ?`).bind(user.id, puzzleId).first<WeeklyAttemptRow>()
  return { attempt: row ? mapWeeklyAttempt(row) : { status: 'available', attemptId: null, generation: null, attempt: null, moves: null, startedAt: null, completedAt: null } }
})
