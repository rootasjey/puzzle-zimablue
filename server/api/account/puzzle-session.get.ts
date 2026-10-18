import { getQuery } from 'h3'
import { getPuzzleSession, mapPuzzleSession, requirePuzzleSessionContext } from '../../utils/puzzle-session'

export default defineEventHandler(async (event) => {
  const { puzzleDate } = getQuery(event)
  const { user, database } = await requirePuzzleSessionContext(event, puzzleDate)
  const session = await getPuzzleSession(database, user.id, String(puzzleDate))
  return { session: mapPuzzleSession(session) }
})
