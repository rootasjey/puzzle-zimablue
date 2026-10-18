import { getDatabase } from '../../utils/cloudflare'
import { requireSignedInUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireSignedInUser(event)
  const body = await readBody<{ enabled?: unknown }>(event)
  if (typeof body?.enabled !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid profile visibility setting.' })
  }

  const database = getDatabase(event)
  const activeUser = await database.prepare('SELECT id, public_name, public_profile_token FROM users WHERE id = ? AND disabled_at IS NULL AND email_verified_at IS NOT NULL')
    .bind(user.id)
    .first<{ id: string; public_name: string | null; public_profile_token: string | null }>()
  if (!activeUser) {
    await clearUserSession(event)
    throw createError({ statusCode: 403, statusMessage: 'Session invalide.' })
  }

  if (!body.enabled) {
    await database.prepare('UPDATE users SET public_profile_token = NULL, updated_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), user.id)
      .run()
    return { enabled: false, token: null }
  }

  if (!activeUser.public_name) {
    throw createError({ statusCode: 409, statusMessage: 'Enregistre un nom public avant de rendre ton profil visible.' })
  }

  if (activeUser.public_profile_token) {
    return { enabled: true, token: activeUser.public_profile_token }
  }

  const token = crypto.randomUUID()
  await database.prepare('UPDATE users SET public_profile_token = ?, updated_at = ? WHERE id = ? AND public_profile_token IS NULL')
    .bind(token, new Date().toISOString(), user.id)
    .run()
  const updatedUser = await database.prepare('SELECT public_profile_token FROM users WHERE id = ?')
    .bind(user.id)
    .first<{ public_profile_token: string | null }>()

  if (!updatedUser?.public_profile_token) {
    throw createError({ statusCode: 500, statusMessage: 'Could not update public profile visibility.' })
  }

  return { enabled: true, token: updatedUser.public_profile_token }
})
