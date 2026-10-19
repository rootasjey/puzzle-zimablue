import { getRouterParam } from 'h3'
import { getWeeklyPuzzle } from '../../utils/weekly-puzzles'

export default defineEventHandler(async (event) => {
  const puzzle = await getWeeklyPuzzle(event, getRouterParam(event, 'weekKey') ?? '')
  if (!puzzle) throw createError({ statusCode: 404, statusMessage: 'Le Master de cette semaine n’est pas publié.' })
  return puzzle
})
