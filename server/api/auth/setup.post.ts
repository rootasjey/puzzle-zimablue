import { getDatabase } from '../../utils/cloudflare'
import { constantTimeEqual, consumeRateLimit, normalizeEmail } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const setupKey = config.adminBootstrapKey
  const initialAdminEmail = normalizeEmail(config.initialAdminEmail)
  if (typeof setupKey !== 'string' || setupKey.length < 32 || !initialAdminEmail) {
    throw createError({ statusCode: 404, statusMessage: 'Configuration initiale indisponible.' })
  }

  const body = await readBody<{ email?: unknown; password?: unknown; setupKey?: unknown }>(event)
  if (typeof body?.email !== 'string' || typeof body.password !== 'string' || typeof body.setupKey !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Informations invalides.' })
  }
  const email = normalizeEmail(body.email)
  if (!await consumeRateLimit(event, 'setup-ip', '', 8)) {
    throw createError({ statusCode: 429, statusMessage: 'Trop de tentatives. Réessaie plus tard.' })
  }
  if (email !== initialAdminEmail || body.password.length < 12 || body.password.length > 128 || !constantTimeEqual(body.setupKey, setupKey)) {
    throw createError({ statusCode: 400, statusMessage: 'Informations invalides.' })
  }
  if (!await consumeRateLimit(event, 'setup', email, 5)) {
    throw createError({ statusCode: 429, statusMessage: 'Trop de tentatives. Réessaie plus tard.' })
  }

  const database = getDatabase(event)
  const bootstrap = await database.prepare("SELECT value FROM app_settings WHERE key = 'admin_bootstrap_complete'").first<{ value: string }>()
  const admin = await database.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").first<{ id: string }>()
  if (bootstrap?.value !== '0' || admin) {
    throw createError({ statusCode: 409, statusMessage: 'Le compte administrateur initial est déjà configuré.' })
  }

  const now = new Date().toISOString()
  const userId = crypto.randomUUID()
  const passwordHash = await hashPassword(body.password)
  const results = await database.batch([
    database.prepare("INSERT INTO users (id, email, password_hash, role, email_verified_at, created_at, updated_at) SELECT ?, ?, ?, 'admin', ?, ?, ? WHERE (SELECT value FROM app_settings WHERE key = 'admin_bootstrap_complete') = '0' AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin')")
      .bind(userId, email, passwordHash, now, now, now),
    database.prepare("UPDATE app_settings SET value = '1' WHERE key = 'admin_bootstrap_complete' AND EXISTS (SELECT 1 FROM users WHERE id = ? AND role = 'admin')")
      .bind(userId),
  ])
  if (results[0]?.meta.changes !== 1 || results[1]?.meta.changes !== 1) {
    throw createError({ statusCode: 409, statusMessage: 'Le compte administrateur initial est déjà configuré.' })
  }

  await setUserSession(event, { user: { id: userId, email, role: 'admin' } })
  return { ok: true }
})
