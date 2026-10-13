import { getDatabase } from '../../../utils/cloudflare'
import { requireAdmin } from '../../../utils/auth'
import { getAdminPuzzles, isIsoDate } from '../../../utils/puzzles'
import type { DailyPuzzle } from '../../../../shared/types/puzzle'

interface DraftRow {
  date: string
  source_date: string | null
  payload_json: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const date = getRouterParam(event, 'date')
  if (!isIsoDate(date)) {
    throw createError({ statusCode: 404, statusMessage: 'Puzzle introuvable.' })
  }

  const database = getDatabase(event)
  const [puzzles, draftResult] = await Promise.all([
    getAdminPuzzles(event),
    database.prepare('SELECT date, source_date, payload_json FROM puzzle_drafts WHERE date = ? OR source_date = ?').bind(date, date).all<DraftRow>(),
  ])
  const drafts = draftResult.results ?? []
  const draft = drafts.find(row => row.date === date)
  const superseded = drafts.some(row => row.source_date === date && row.date !== date)

  if (superseded) {
    throw createError({ statusCode: 404, statusMessage: 'Puzzle introuvable.' })
  }

  if (draft) {
    return { ...JSON.parse(draft.payload_json) as DailyPuzzle, date, status: 'draft' as const }
  }

  const puzzle = puzzles.find(item => item.date === date)
  if (!puzzle) {
    throw createError({ statusCode: 404, statusMessage: 'Puzzle introuvable.' })
  }
  return puzzle
})
