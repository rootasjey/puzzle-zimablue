import type { H3Event } from 'h3'
import type { WeeklyPuzzle, PuzzleStatus } from '../../shared/types/puzzle'
import { createMasterPuzzleId } from '../../shared/utils/puzzle-attempt'
import { getIsoWeekKeyForDate, getIsoWeekStart, isValidIsoWeekKey } from '../../shared/utils/iso-week'
import { isMasterGridSize, isZimablueImageUrl } from '../../shared/utils/master-config'
import { getDatabase } from './cloudflare'
import { getParisDate } from './puzzles'

interface WeeklyPuzzleRow {
  puzzle_id: string
  week_key: string
  week_start: string
  title: string
  note: string
  title_en: string
  note_en: string
  image_name: string
  image_slug: string
  image_url: string
  image_description: string
  image_url_landscape: string | null
  image_url_portrait: string | null
  image_url_square: string | null
  grid_rows: number
  grid_columns: number
  status: PuzzleStatus
}

const weeklyPuzzleColumns = `puzzle_id, week_key, week_start, title, note, title_en, note_en,
  image_name, image_slug, image_url, image_description, image_url_landscape,
  image_url_portrait, image_url_square, grid_rows, grid_columns, status`

export function mapWeeklyPuzzle(row: WeeklyPuzzleRow): WeeklyPuzzle {
  return {
    puzzleId: row.puzzle_id,
    weekKey: row.week_key,
    weekStart: row.week_start,
    title: row.title,
    note: row.note,
    titleEn: row.title_en ?? '',
    noteEn: row.note_en ?? '',
    imageName: row.image_name,
    imageSlug: row.image_slug,
    imageUrl: row.image_url,
    imageDescription: row.image_description ?? '',
    imageUrlLandscape: row.image_url_landscape,
    imageUrlPortrait: row.image_url_portrait,
    imageUrlSquare: row.image_url_square,
    gridRows: row.grid_rows,
    gridColumns: row.grid_columns,
    pieceCount: row.grid_rows * row.grid_columns,
    status: row.status,
  }
}

export function getCurrentIsoWeekKey(event?: H3Event): string {
  return getIsoWeekKeyForDate(getParisDate())
}

export function assertMasterWeekKey(value: unknown): string {
  if (!isValidIsoWeekKey(value)) throw createError({ statusCode: 400, statusMessage: 'Semaine ISO invalide.' })
  return value
}

export async function getWeeklyPuzzle(event: H3Event, weekKey: string, includeDraft = false): Promise<WeeklyPuzzle | null> {
  const key = assertMasterWeekKey(weekKey)
  const statusFilter = includeDraft ? '' : " AND status = 'published'"
  const row = await getDatabase(event).prepare(`SELECT ${weeklyPuzzleColumns} FROM weekly_puzzles WHERE week_key = ?${statusFilter}`)
    .bind(key)
    .first<WeeklyPuzzleRow>()
  return row && (includeDraft || row.week_start <= getParisDate()) ? mapWeeklyPuzzle(row) : null
}

export async function getCurrentWeeklyPuzzle(event: H3Event): Promise<WeeklyPuzzle | null> {
  return getWeeklyPuzzle(event, getCurrentIsoWeekKey(event))
}

export async function getAllWeeklyPuzzles(event: H3Event): Promise<WeeklyPuzzle[]> {
  const result = await getDatabase(event).prepare(`SELECT ${weeklyPuzzleColumns} FROM weekly_puzzles ORDER BY week_start DESC`).all<WeeklyPuzzleRow>()
  return (result.results ?? []).map(mapWeeklyPuzzle)
}

export function validateWeeklyPuzzleInput(body: Record<string, unknown>) {
  const weekKey = body.weekKey
  if (!isValidIsoWeekKey(weekKey)) throw createError({ statusCode: 400, statusMessage: 'Semaine ISO invalide.' })
  const weekStart = getIsoWeekStart(weekKey)
  if (weekStart < getIsoWeekStart(getCurrentIsoWeekKey())) {
    throw createError({ statusCode: 400, statusMessage: 'Un Master ne peut pas être préparé pour une semaine passée.' })
  }
  const imageUrl = isZimablueImageUrl(body.imageUrl) ? new URL(body.imageUrl).href : null
  const titleEn = body.titleEn ?? ''
  const noteEn = body.noteEn ?? ''
  const imageDescription = body.imageDescription ?? ''
  const gridSize = body.gridSize
  if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 120
    || typeof body.note !== 'string' || body.note.length > 500
    || typeof titleEn !== 'string' || titleEn.length > 120
    || typeof noteEn !== 'string' || noteEn.length > 500
    || typeof body.imageName !== 'string' || !body.imageName.trim() || body.imageName.length > 160
    || typeof body.imageSlug !== 'string' || !/^[\w-]{1,180}$/.test(body.imageSlug)
    || typeof imageDescription !== 'string' || imageDescription.length > 2000
    || !isMasterGridSize(gridSize) || !imageUrl
    || (body.status !== 'draft' && body.status !== 'published')) {
    throw createError({ statusCode: 400, statusMessage: 'Les informations du Master sont invalides.' })
  }
  return {
    puzzleId: createMasterPuzzleId(weekKey),
    weekKey,
    weekStart,
    title: body.title.trim(),
    note: body.note.trim(),
    titleEn: titleEn.trim(),
    noteEn: noteEn.trim(),
    imageName: body.imageName.trim(),
    imageSlug: body.imageSlug,
    imageUrl,
    imageDescription: imageDescription.trim(),
    gridSize,
    gridRows: gridSize,
    gridColumns: gridSize,
    status: body.status as PuzzleStatus,
  }
}
