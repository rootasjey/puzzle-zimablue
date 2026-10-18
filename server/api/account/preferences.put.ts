import type { AccountPreferences, TroncheAvatarVariant } from '../../../shared/types/account-preferences'
import { normalizeTroncheAvatarColors, TRONCHE_AVATAR_VARIANTS } from '../../../shared/types/account-preferences'
import { requireSignedInUser } from '../../utils/auth'
import { getDatabase } from '../../utils/cloudflare'

export default defineEventHandler(async (event): Promise<AccountPreferences> => {
  const sessionUser = await requireSignedInUser(event)
  const body = await readBody<Record<string, unknown>>(event)
  const database = getDatabase(event)
  const account = await database.prepare('SELECT avatar_seed, avatar_colors, disabled_at, email_verified_at FROM users WHERE id = ?')
    .bind(sessionUser.id)
    .first<{ avatar_seed: string; avatar_colors: string; disabled_at: string | null; email_verified_at: string | null }>()

  if (!account || account.disabled_at || !account.email_verified_at) {
    throw createError({ statusCode: 403, statusMessage: 'Un compte vérifié est nécessaire.' })
  }

  const avatarColors = body.avatarColors === undefined
    ? normalizeTroncheAvatarColors(account.avatar_colors.split(',').filter(Boolean))
    : normalizeTroncheAvatarColors(body.avatarColors)

  if (typeof body.showReferenceImage !== 'boolean'
    || typeof body.reduceMotion !== 'boolean'
    || typeof body.soundEnabled !== 'boolean'
    || typeof body.soundVolume !== 'number'
    || !Number.isInteger(body.soundVolume)
    || body.soundVolume < 0 || body.soundVolume > 100
    || typeof body.avatarVariant !== 'string'
    || !TRONCHE_AVATAR_VARIANTS.includes(body.avatarVariant as TroncheAvatarVariant)
    || avatarColors === null) {
    throw createError({ statusCode: 400, statusMessage: 'Les préférences sont invalides.' })
  }

  const seed = account.avatar_seed || createOpaqueAvatarSeed()
  await database.prepare(`UPDATE users SET show_reference_image = ?, reduce_motion = ?, sound_enabled = ?, sound_volume = ?,
    avatar_variant = ?, avatar_seed = ?, avatar_colors = ?, updated_at = ? WHERE id = ?`)
    .bind(Number(body.showReferenceImage), Number(body.reduceMotion), Number(body.soundEnabled), body.soundVolume,
      body.avatarVariant, seed, avatarColors.join(','), new Date().toISOString(), sessionUser.id)
    .run()

  return {
    showReferenceImage: body.showReferenceImage,
    reduceMotion: body.reduceMotion,
    soundEnabled: body.soundEnabled,
    soundVolume: body.soundVolume,
    avatarVariant: body.avatarVariant as TroncheAvatarVariant,
    avatarSeed: seed,
    avatarColors,
  }
})

function createOpaqueAvatarSeed(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}
