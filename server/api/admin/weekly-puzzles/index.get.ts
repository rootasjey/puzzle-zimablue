import { requireAdmin } from '../../../utils/auth'
import { getAllWeeklyPuzzles } from '../../../utils/weekly-puzzles'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return getAllWeeklyPuzzles(event)
})
