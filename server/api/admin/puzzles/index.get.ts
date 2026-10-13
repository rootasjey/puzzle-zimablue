import { getDatabase } from '../../../utils/cloudflare'
import { requireAdmin } from '../../../utils/auth'
import { getAdminPuzzles } from '../../../utils/puzzles'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const [puzzles, drafts] = await Promise.all([
    getAdminPuzzles(event),
    getDatabase(event).prepare('SELECT date, source_date, payload_json FROM puzzle_drafts ORDER BY date').all<{ date: string; source_date: string | null; payload_json: string }>(),
  ])
  const draftRows = drafts.results ?? []
  const rows = draftRows.map(row => ({ ...JSON.parse(row.payload_json), date: row.date, sourceDate: row.source_date, status: 'draft' as const }))
  const supersededDates = new Set(draftRows.map(row => row.source_date).filter((date): date is string => !!date))
  const draftDates = new Set(draftRows.map(row => row.date))
  return [...puzzles.filter(puzzle => !supersededDates.has(puzzle.date) && !draftDates.has(puzzle.date)), ...rows]
})
