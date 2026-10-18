import { getQuery } from 'h3'
import { getPuzzleSession, mapPuzzleSession, requirePuzzleSessionContext } from '../../utils/puzzle-session'

export default defineEventHandler(async (event) => {
  const { puzzleId } = getQuery(event)
  const { user, database } = await requirePuzzleSessionContext(event, puzzleId)
  const session = await getPuzzleSession(database, user.id, String(puzzleId))
  return { session: mapPuzzleSession(session) }
})
