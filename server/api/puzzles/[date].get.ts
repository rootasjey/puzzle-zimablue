import { getPuzzleByDate, isIsoDate } from '../../utils/puzzles'

export default defineEventHandler(async (event) => {
  const date = getRouterParam(event, 'date') ?? ''
  if (!isIsoDate(date)) {
    throw createError({ statusCode: 404, statusMessage: 'Ce puzzle n’est pas encore dans l’archive.' })
  }
  const puzzle = await getPuzzleByDate(event, date)
  if (!puzzle) {
    throw createError({ statusCode: 404, statusMessage: 'Ce puzzle n’est pas encore dans l’archive.' })
  }
  return puzzle
})
