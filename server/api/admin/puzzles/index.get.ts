import { requireAdmin } from '../../../utils/auth'
import { getAdminPuzzles } from '../../../utils/puzzles'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return getAdminPuzzles(event)
})
