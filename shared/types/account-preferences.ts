export const TRONCHE_AVATAR_VARIANTS = ['marble', 'bauhaus', 'beam', 'pixel', 'ring', 'sunset'] as const

export type TroncheAvatarVariant = typeof TRONCHE_AVATAR_VARIANTS[number]
export type PreferredLanguage = 'fr' | 'en'

export interface AccountPreferences {
  preferredLanguage: PreferredLanguage
  showReferenceImage: boolean
  reduceMotion: boolean
  soundEnabled: boolean
  soundVolume: number
  avatarVariant: TroncheAvatarVariant
  avatarSeed: string
  avatarColors: string[]
}

export const DEFAULT_ACCOUNT_PREFERENCES: AccountPreferences = {
  preferredLanguage: 'fr',
  showReferenceImage: true,
  reduceMotion: false,
  soundEnabled: true,
  soundVolume: 100,
  avatarVariant: 'marble',
  avatarSeed: '',
  avatarColors: [],
}

export function normalizeTroncheAvatarColors(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  if (value.length === 0) return []
  if (value.length < 2 || value.length > 8) return null

  const colors = value.map((color) => {
    if (typeof color !== 'string' || !/^#?[\da-f]{6}$/i.test(color.trim())) return null
    return `#${color.trim().replace(/^#/, '').toUpperCase()}`
  })

  return colors.every((color): color is string => color !== null) ? colors : null
}
