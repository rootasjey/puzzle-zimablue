import { getDatabase } from '../../utils/cloudflare'
import { requireSignedInUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireSignedInUser(event)
  const body = await readBody<{ publicName?: unknown }>(event)
  if (typeof body?.publicName !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Nom public invalide.' })
  }

  const publicName = body.publicName.trim()
  if (publicName && (Array.from(publicName).length > 24 || /[\u0000-\u001f\u007f]/u.test(publicName))) {
    throw createError({ statusCode: 400, statusMessage: 'Le nom public doit contenir au plus 24 caractères.' })
  }

  const database = getDatabase(event)
  const activeUser = await database.prepare('SELECT id FROM users WHERE id = ? AND disabled_at IS NULL AND email_verified_at IS NOT NULL')
    .bind(user.id)
    .first<{ id: string }>()
  if (!activeUser) {
    await clearUserSession(event)
    throw createError({ statusCode: 403, statusMessage: 'Session invalide.' })
  }

  await database.prepare('UPDATE users SET public_name = ?, updated_at = ? WHERE id = ?')
    .bind(publicName || null, new Date().toISOString(), user.id)
    .run()

  return { publicName }
})
