import { getParisDate } from '../../utils/puzzles'
import { getPuzzleLeaderboard } from '../../utils/leaderboard'

export default defineEventHandler(async (event) => {
  return await getPuzzleLeaderboard(event, getParisDate()) ?? { scope: 'daily', puzzle: null, metrics: null, entries: [] }
})
