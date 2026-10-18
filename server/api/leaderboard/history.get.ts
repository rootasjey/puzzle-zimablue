import { getQuery } from 'h3'
import { getPuzzleLeaderboard } from '../../utils/leaderboard'
import { isIsoDate } from '../../utils/puzzles'

export default defineEventHandler(async (event) => {
  const date = getQuery(event).date
  if (!isIsoDate(date)) {
    throw createError({ statusCode: 400, statusMessage: 'Date de puzzle invalide.' })
  }

  const leaderboard = await getPuzzleLeaderboard(event, date)
  if (!leaderboard) {
    throw createError({ statusCode: 404, statusMessage: 'Ce puzzle ne figure pas dans les archives.' })
  }

  return leaderboard
})
