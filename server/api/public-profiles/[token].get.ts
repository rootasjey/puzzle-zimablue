import { getRouterParam } from 'h3'
import { getDatabase } from '../../utils/cloudflare'
import { getVerifiedPlayerStats } from '../../utils/player-stats'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    throw createError({ statusCode: 404, statusMessage: 'Profil public introuvable.' })
  }

  const database = getDatabase(event)
  const profile = await database.prepare(`SELECT id, public_name FROM users
      WHERE public_profile_token = ? AND public_name IS NOT NULL
        AND disabled_at IS NULL AND email_verified_at IS NOT NULL`)
    .bind(token)
    .first<{ id: string; public_name: string }>()
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Profil public introuvable.' })
  }

  return {
    profile: { publicName: profile.public_name },
    stats: await getVerifiedPlayerStats(database, profile.id),
  }
})
