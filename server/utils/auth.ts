import type { H3Event } from 'h3'
import { getDatabase } from './cloudflare'

interface UserRow {
  id: string
  email: string
  role: 'admin' | 'user'
  disabled_at: string | null
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function requireSignedInUser(event: H3Event): Promise<NonNullable<Awaited<ReturnType<typeof getUserSession>>['user']>> {
  const session = await requireUserSession(event)
  return session.user!
}

export async function requireAdmin(event: H3Event): Promise<UserRow> {
  const sessionUser = await requireSignedInUser(event)
  const user = await getDatabase(event)
    .prepare('SELECT id, email, role, disabled_at FROM users WHERE id = ?')
    .bind(sessionUser.id)
    .first<UserRow>()

  if (!user || user.disabled_at || user.role !== 'admin') {
    await clearUserSession(event)
    throw createError({ statusCode: 403, statusMessage: 'Accès réservé aux administrateurs.' })
  }
  return user
}

export async function consumeRateLimit(event: H3Event, action: string, identity = '', maxAttempts = 8): Promise<boolean> {
  const database = getDatabase(event)
  const ip = getRequestHeader(event, 'cf-connecting-ip') ?? 'local'
  const key = await sha256Hex(`${action}:${ip}:${identity}`)
  const now = Math.floor(Date.now() / 1000)
  const windowSeconds = 15 * 60
  const row = await database.prepare(`
    INSERT INTO auth_rate_limits (key, window_started, attempts)
    VALUES (?, ?, 1)
    ON CONFLICT(key) DO UPDATE SET
      attempts = CASE WHEN auth_rate_limits.window_started <= ? THEN 1 ELSE auth_rate_limits.attempts + 1 END,
      window_started = CASE WHEN auth_rate_limits.window_started <= ? THEN ? ELSE auth_rate_limits.window_started END
    RETURNING attempts
  `).bind(key, now, now - windowSeconds, now - windowSeconds, now).first<{ attempts: number }>()
  return (row?.attempts ?? maxAttempts + 1) <= maxAttempts
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

export function createOpaqueToken(byteLength = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength))
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}
