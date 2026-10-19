import { getCurrentWeeklyPuzzle } from '../../utils/weekly-puzzles'

export default defineEventHandler(event => getCurrentWeeklyPuzzle(event))
