import { getPublishedPuzzles } from '../../utils/puzzles'

export default defineEventHandler(event => getPublishedPuzzles(event))
