import { getDatabase } from '../../utils/cloudflare'
import { sha256Hex } from '../../utils/auth'

interface VerifiedAccount {
  user_id: string
  email: string
  role: 'user' | 'admin'
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: unknown }>(event)
  if (typeof body?.token !== 'string' || body.token.length !== 64) {
    throw createError({ statusCode: 400, statusMessage: 'Ce lien de vérification est invalide ou expiré.' })
  }

  const tokenHash = await sha256Hex(body.token)
  const now = new Date().toISOString()
  const database = getDatabase(event)
  const account = await database.prepare(`SELECT users.id AS user_id, users.email, users.role
    FROM email_verification_tokens
    JOIN users ON users.id = email_verification_tokens.user_id
    WHERE token_hash = ? AND used_at IS NULL AND expires_at > ? AND users.disabled_at IS NULL`)
    .bind(tokenHash, now)
    .first<VerifiedAccount>()
  if (!account) throw createError({ statusCode: 400, statusMessage: 'Ce lien de vérification est invalide ou expiré.' })

  const result = await database.batch([
    database.prepare('UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?), updated_at = ? WHERE id = ? AND disabled_at IS NULL')
      .bind(now, now, account.user_id),
    database.prepare(`INSERT OR IGNORE INTO puzzle_completions (user_id, puzzle_date, moves, completed_at, score_verified)
      SELECT user_id, pending_puzzle_date, pending_moves, ?, pending_score_verified FROM email_verification_tokens
      WHERE token_hash = ? AND user_id = ? AND pending_puzzle_date IS NOT NULL AND pending_moves IS NOT NULL AND used_at IS NULL AND expires_at > ?`)
      .bind(now, tokenHash, account.user_id, now),
    database.prepare('UPDATE email_verification_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?')
      .bind(now, tokenHash, now),
  ])
  if (result[0]?.meta.changes !== 1 || result[2]?.meta.changes !== 1) {
    throw createError({ statusCode: 400, statusMessage: 'Ce lien de vérification est invalide ou expiré.' })
  }

  await setUserSession(event, { user: { id: account.user_id, email: account.email, role: account.role } })
  return { ok: true }
})
