export const TRONCHE_AVATAR_VARIANTS = ['marble', 'bauhaus', 'beam', 'pixel', 'ring', 'sunset'] as const

export type TroncheAvatarVariant = typeof TRONCHE_AVATAR_VARIANTS[number]

export interface AccountPreferences {
  showReferenceImage: boolean
  reduceMotion: boolean
  soundEnabled: boolean
  soundVolume: number
  avatarVariant: TroncheAvatarVariant
  avatarSeed: string
}

export const DEFAULT_ACCOUNT_PREFERENCES: AccountPreferences = {
  showReferenceImage: true,
  reduceMotion: false,
  soundEnabled: true,
  soundVolume: 100,
  avatarVariant: 'marble',
  avatarSeed: '',
}
