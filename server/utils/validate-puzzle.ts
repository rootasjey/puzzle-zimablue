import type { PuzzleStatus } from '../../shared/types/puzzle'
import { isIsoDate } from './puzzles'

export interface PuzzleInput {
  date?: unknown
  title?: unknown
  note?: unknown
  titleEn?: unknown
  noteEn?: unknown
  imageName?: unknown
  imageSlug?: unknown
  imageUrl?: unknown
  gridSize?: unknown
  status?: unknown
}

export function validatePuzzleInput(body: PuzzleInput) {
  const imageUrl = safeImageUrl(body.imageUrl)
  const titleEn = body.titleEn ?? ''
  const noteEn = body.noteEn ?? ''
  if (!isIsoDate(body.date) || typeof body.title !== 'string' || !body.title.trim() || body.title.length > 120
    || typeof body.note !== 'string' || body.note.length > 500
    || typeof titleEn !== 'string' || titleEn.length > 120
    || typeof noteEn !== 'string' || noteEn.length > 500
    || typeof body.imageName !== 'string' || !body.imageName.trim() || body.imageName.length > 160
    || typeof body.imageSlug !== 'string' || !/^[\w-]{1,180}$/.test(body.imageSlug)
    || typeof body.gridSize !== 'number' || !Number.isInteger(body.gridSize) || body.gridSize < 3 || body.gridSize > 5
    || (body.status !== 'draft' && body.status !== 'published') || !imageUrl) {
    throw createError({ statusCode: 400, statusMessage: 'Les informations du puzzle sont invalides.' })
  }
  return {
    date: body.date,
    title: body.title.trim(),
    note: body.note.trim(),
    titleEn: titleEn.trim(),
    noteEn: noteEn.trim(),
    imageName: body.imageName.trim(),
    imageSlug: body.imageSlug,
    imageUrl,
    gridSize: body.gridSize,
    gridRows: body.gridSize,
    gridColumns: body.gridSize,
    status: body.status as PuzzleStatus,
  }
}

function safeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.hostname !== 'zimablue.cc' || !url.pathname.startsWith('/images/')) return null
    return url.href
  } catch {
    return null
  }
}
