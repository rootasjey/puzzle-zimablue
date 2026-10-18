import type { H3Event } from 'h3'
import { decodePuzzleAttempt, isPuzzleId } from '#shared/utils/puzzle-attempt'
import type { PuzzleSessionSnapshot } from '#shared/types/puzzle-session'
import { requireSignedInUser } from './auth'
import { getDatabase, type D1Database } from './cloudflare'
import { getParisDate } from './puzzles'

interface SessionUser {
  id: string
}

export interface PuzzleSessionRow {
  revision: number
  attempt: string
  updated_at: string
}

export interface SessionPuzzle {
  puzzle_id: string
  grid_rows: number
  grid_columns: number
}

export async function requirePuzzleSessionContext(event: H3Event, puzzleId: unknown) {
  if (!isPuzzleId(puzzleId)) throw createError({ statusCode: 400, statusMessage: 'Identifiant de puzzle invalide.' })

  const sessionUser = await requireSignedInUser(event)
  const database = getDatabase(event)
  const activeUser = await database.prepare('SELECT id FROM users WHERE id = ? AND disabled_at IS NULL AND email_verified_at IS NOT NULL')
    .bind(sessionUser.id)
    .first<SessionUser>()
  if (!activeUser) {
    await clearUserSession(event)
    throw createError({ statusCode: 403, statusMessage: 'Session invalide.' })
  }

  const puzzle: SessionPuzzle | null = puzzleId.startsWith('daily:')
    ? await database.prepare("SELECT 'daily:' || date AS puzzle_id, grid_rows, grid_columns FROM puzzles WHERE date = ? AND status = 'published' AND date <= ?")
        .bind(puzzleId.slice('daily:'.length), getParisDate())
        .first<SessionPuzzle>()
    : await database.prepare("SELECT puzzle_id, grid_rows, grid_columns FROM weekly_puzzles WHERE puzzle_id = ? AND status = 'published' AND week_start <= ?")
        .bind(puzzleId, getParisDate())
        .first<SessionPuzzle>()
  if (!puzzle) throw createError({ statusCode: 404, statusMessage: 'Puzzle introuvable.' })

  return { user: activeUser, database, puzzle }
}

export function mapPuzzleSession(row: PuzzleSessionRow | null): PuzzleSessionSnapshot | null {
  return row ? { revision: row.revision, attempt: row.attempt, updatedAt: row.updated_at } : null
}

export function validatePuzzleSessionAttempt(puzzle: SessionPuzzle, attempt: unknown) {
  return decodePuzzleAttempt({ puzzleId: puzzle.puzzle_id, gridRows: puzzle.grid_rows, gridColumns: puzzle.grid_columns }, attempt)
}

export async function getPuzzleSession(database: D1Database, userId: string, puzzleId: string) {
  return database.prepare('SELECT revision, attempt, updated_at FROM puzzle_sessions WHERE user_id = ? AND puzzle_id = ?')
    .bind(userId, puzzleId)
    .first<PuzzleSessionRow>()
}
