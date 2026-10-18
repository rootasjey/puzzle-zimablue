import type { H3Event } from 'h3'
import type { DailyPuzzle, PuzzleStatus } from '../../shared/types/puzzle'
import { createDailyPuzzleId } from '../../shared/utils/puzzle-attempt'
import { getDatabase } from './cloudflare'

interface PuzzleRow {
  date: string
  title: string
  note: string
  title_en: string
  note_en: string
  image_name: string
  image_slug: string
  image_url: string
  image_description: string
  grid_size: number
  grid_rows: number
  grid_columns: number
  status: PuzzleStatus
}

export function mapPuzzle(row: PuzzleRow): DailyPuzzle {
  return {
    puzzleId: createDailyPuzzleId(row.date),
    date: row.date,
    title: row.title,
    note: row.note,
    titleEn: row.title_en ?? '',
    noteEn: row.note_en ?? '',
    imageName: row.image_name,
    imageSlug: row.image_slug,
    imageUrl: row.image_url,
    imageDescription: row.image_description ?? '',
    gridSize: row.grid_size,
    gridRows: row.grid_rows,
    gridColumns: row.grid_columns,
    pieceCount: row.grid_rows * row.grid_columns,
    status: row.status,
  }
}

export async function getPuzzleByDate(event: H3Event, date: string): Promise<DailyPuzzle | null> {
  const row = await getDatabase(event)
    .prepare('SELECT date, title, note, title_en, note_en, image_name, image_slug, image_url, image_description, grid_size, grid_rows, grid_columns, status FROM puzzles WHERE date = ? AND status = ? AND date <= ?')
    .bind(date, 'published', getParisDate())
    .first<PuzzleRow>()
  return row ? mapPuzzle(row) : null
}

export async function getPublishedPuzzles(event: H3Event): Promise<DailyPuzzle[]> {
  const result = await getDatabase(event)
    .prepare('SELECT date, title, note, title_en, note_en, image_name, image_slug, image_url, image_description, grid_size, grid_rows, grid_columns, status FROM puzzles WHERE status = ? AND date <= ? ORDER BY date DESC')
    .bind('published', getParisDate())
    .all<PuzzleRow>()
  return (result.results ?? []).map(mapPuzzle)
}

export async function getAdminPuzzles(event: H3Event): Promise<DailyPuzzle[]> {
  const result = await getDatabase(event)
    .prepare('SELECT date, title, note, title_en, note_en, image_name, image_slug, image_url, image_description, grid_size, grid_rows, grid_columns, status FROM puzzles ORDER BY date')
    .all<PuzzleRow>()
  return (result.results ?? []).map(mapPuzzle)
}

export function getParisDate(date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(date)
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T12:00:00Z`))
    && new Date(`${value}T12:00:00Z`).toISOString().startsWith(value)
}
