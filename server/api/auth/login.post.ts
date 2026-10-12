import { getDatabase } from '../../utils/cloudflare'
import { consumeRateLimit, normalizeEmail } from '../../utils/auth'

interface UserLoginRow {
  id: string
  email: string
  password_hash: string
  role: 'admin' | 'user'
  disabled_at: string | null
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: unknown; password?: unknown }>(event)
  if (typeof body?.email !== 'string' || typeof body.password !== 'string' || body.password.length > 128) {
    throw createError({ statusCode: 400, statusMessage: 'Adresse ou mot de passe incorrect.' })
  }

  const email = normalizeEmail(body.email)
  if (!await consumeRateLimit(event, 'login', email, 8)) {
    throw createError({ statusCode: 429, statusMessage: 'Trop de tentatives. Réessaie dans 15 minutes.' })
  }
  const user = await getDatabase(event)
    .prepare('SELECT id, email, password_hash, role, disabled_at FROM users WHERE email = ?')
    .bind(email)
    .first<UserLoginRow>()
  if (!user || user.disabled_at || !await verifyPassword(user.password_hash, body.password)) {
    throw createError({ statusCode: 401, statusMessage: 'Adresse ou mot de passe incorrect.' })
  }

  await setUserSession(event, { user: { id: user.id, email: user.email, role: user.role } })
  return { ok: true, user: { id: user.id, email: user.email, role: user.role } }
})
