import { getPuzzleSession, mapPuzzleSession, requirePuzzleSessionContext, validatePuzzleSessionAttempt } from '../../utils/puzzle-session'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ puzzleDate?: unknown; attempt?: unknown; expectedRevision?: unknown }>(event)
  if (!Number.isInteger(body?.expectedRevision) || Number(body.expectedRevision) < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Révision de sauvegarde invalide.' })
  }

  const { puzzleDate, attempt, expectedRevision } = body
  const { user, database, puzzle } = await requirePuzzleSessionContext(event, puzzleDate)
  if (!validatePuzzleSessionAttempt(String(puzzleDate), puzzle.grid_size, attempt)) {
    throw createError({ statusCode: 400, statusMessage: 'État du puzzle invalide.' })
  }

  const now = new Date().toISOString()
  const revision = Number(expectedRevision) + 1
  const saved = await database.prepare(`INSERT INTO puzzle_sessions (user_id, puzzle_date, attempt, revision, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, puzzle_date) DO UPDATE SET
      attempt = excluded.attempt,
      revision = excluded.revision,
      updated_at = excluded.updated_at
    WHERE puzzle_sessions.revision = ?
    RETURNING revision, attempt, updated_at`)
    .bind(user.id, String(puzzleDate), String(attempt), revision, now, Number(expectedRevision))
    .first<{ revision: number; attempt: string; updated_at: string }>()

  if (saved) return { saved: true, session: mapPuzzleSession(saved) }

  const current = await getPuzzleSession(database, user.id, String(puzzleDate))
  return { saved: false, session: mapPuzzleSession(current) }
})
