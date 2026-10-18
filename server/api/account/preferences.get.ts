import type { AccountPreferences, TroncheAvatarVariant } from '../../../shared/types/account-preferences'
import { normalizeTroncheAvatarColors, TRONCHE_AVATAR_VARIANTS } from '../../../shared/types/account-preferences'
import { createOpaqueToken, requireSignedInUser } from '../../utils/auth'
import { getDatabase } from '../../utils/cloudflare'

interface PreferencesRow {
  show_reference_image: number
  reduce_motion: number
  sound_enabled: number
  sound_volume: number
  avatar_variant: string
  avatar_seed: string
  avatar_colors: string
  disabled_at: string | null
  email_verified_at: string | null
}

export default defineEventHandler(async (event): Promise<AccountPreferences> => {
  const sessionUser = await requireSignedInUser(event)
  const database = getDatabase(event)
  let row = await database.prepare(`SELECT show_reference_image, reduce_motion, sound_enabled, sound_volume,
    avatar_variant, avatar_seed, avatar_colors, disabled_at, email_verified_at FROM users WHERE id = ?`)
    .bind(sessionUser.id)
    .first<PreferencesRow>()

  if (!row || row.disabled_at || !row.email_verified_at) {
    throw createError({ statusCode: 403, statusMessage: 'Un compte vérifié est nécessaire.' })
  }

  if (!row.avatar_seed) {
    const seed = createOpaqueToken(12)
    await database.prepare("UPDATE users SET avatar_seed = ?, updated_at = ? WHERE id = ? AND avatar_seed = ''")
      .bind(seed, new Date().toISOString(), sessionUser.id)
      .run()
    row = await database.prepare(`SELECT show_reference_image, reduce_motion, sound_enabled, sound_volume,
      avatar_variant, avatar_seed, avatar_colors, disabled_at, email_verified_at FROM users WHERE id = ?`)
      .bind(sessionUser.id)
      .first<PreferencesRow>()
    if (!row?.avatar_seed) throw createError({ statusCode: 500, statusMessage: 'Impossible de préparer le profil.' })
  }

  const avatarVariant = TRONCHE_AVATAR_VARIANTS.includes(row.avatar_variant as TroncheAvatarVariant)
    ? row.avatar_variant as TroncheAvatarVariant
    : 'marble'

  return {
    showReferenceImage: Boolean(row.show_reference_image),
    reduceMotion: Boolean(row.reduce_motion),
    soundEnabled: Boolean(row.sound_enabled),
    soundVolume: Math.max(0, Math.min(100, row.sound_volume)),
    avatarVariant,
    avatarSeed: row.avatar_seed,
    avatarColors: normalizeTroncheAvatarColors(row.avatar_colors.split(',').filter(Boolean)) ?? [],
  }
})
