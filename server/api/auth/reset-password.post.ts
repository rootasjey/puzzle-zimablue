import { getDatabase } from '../../utils/cloudflare'
import { sha256Hex } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: unknown; password?: unknown }>(event)
  if (typeof body?.token !== 'string' || body.token.length !== 64 || typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 128) {
    throw createError({ statusCode: 400, statusMessage: 'Ce lien est invalide ou expiré.' })
  }

  const tokenHash = await sha256Hex(body.token)
  const now = new Date().toISOString()
  const passwordHash = await hashPassword(body.password)
  const database = getDatabase(event)
  const results = await database.batch([
    database.prepare(`UPDATE users SET password_hash = ?, updated_at = ?
      WHERE id = (SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?)`)
      .bind(passwordHash, now, tokenHash, now),
    database.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?')
      .bind(now, tokenHash, now),
  ])
  if (results[0]?.meta.changes !== 1 || results[1]?.meta.changes !== 1) {
    throw createError({ statusCode: 400, statusMessage: 'Ce lien est invalide ou expiré.' })
  }
  await clearUserSession(event)
  return { ok: true }
})
