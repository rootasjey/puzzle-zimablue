import { getDatabase } from '../../../utils/cloudflare'
import { requireAdmin } from '../../../utils/auth'
import { isIsoDate } from '../../../utils/puzzles'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const date = getRouterParam(event, 'date') ?? ''
  if (!isIsoDate(date)) throw createError({ statusCode: 400, statusMessage: 'Date invalide.' })
  const result = await getDatabase(event).prepare("DELETE FROM puzzles WHERE date = ? AND status = 'draft'")
    .bind(date)
    .run()
  if (result.meta.changes !== 1) {
    throw createError({ statusCode: 409, statusMessage: 'Seuls les brouillons peuvent être supprimés.' })
  }
  return { ok: true }
})
