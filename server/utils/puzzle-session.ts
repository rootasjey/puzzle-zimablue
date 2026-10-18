import type { H3Event } from 'h3'
import { decodePuzzleAttempt } from '#shared/utils/puzzle-attempt'
import type { PuzzleSessionSnapshot } from '#shared/types/puzzle-session'
import { requireSignedInUser } from './auth'
import { getDatabase, type D1Database } from './cloudflare'
import { getParisDate, isIsoDate } from './puzzles'

interface SessionUser {
  id: string
}

export interface PuzzleSessionRow {
  revision: number
  attempt: string
  updated_at: string
}

export async function requirePuzzleSessionContext(event: H3Event, date: unknown) {
  if (!isIsoDate(date)) throw createError({ statusCode: 400, statusMessage: 'Date de puzzle invalide.' })

  const sessionUser = await requireSignedInUser(event)
  const database = getDatabase(event)
  const activeUser = await database.prepare('SELECT id FROM users WHERE id = ? AND disabled_at IS NULL AND email_verified_at IS NOT NULL')
    .bind(sessionUser.id)
    .first<SessionUser>()
  if (!activeUser) {
    await clearUserSession(event)
    throw createError({ statusCode: 403, statusMessage: 'Session invalide.' })
  }

  const puzzle = await database.prepare("SELECT date, grid_size FROM puzzles WHERE date = ? AND status = 'published' AND date <= ?")
    .bind(date, getParisDate())
    .first<{ date: string; grid_size: number }>()
  if (!puzzle) throw createError({ statusCode: 404, statusMessage: 'Puzzle introuvable.' })

  return { user: activeUser, database, puzzle }
}

export function mapPuzzleSession(row: PuzzleSessionRow | null): PuzzleSessionSnapshot | null {
  return row ? { revision: row.revision, attempt: row.attempt, updatedAt: row.updated_at } : null
}

export function validatePuzzleSessionAttempt(date: string, gridSize: number, attempt: unknown) {
  return decodePuzzleAttempt(date, gridSize, attempt)
}

export async function getPuzzleSession(database: D1Database, userId: string, date: string) {
  return database.prepare('SELECT revision, attempt, updated_at FROM puzzle_sessions WHERE user_id = ? AND puzzle_date = ?')
    .bind(userId, date)
    .first<PuzzleSessionRow>()
}
