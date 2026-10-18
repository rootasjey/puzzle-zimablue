import { DEFAULT_ACCOUNT_PREFERENCES, type AccountPreferences, type TroncheAvatarVariant } from '#shared/types/account-preferences'

const LOCAL_STORAGE_KEY = 'puzzle-zimablue:guest-preferences'

export function useAccountPreferences() {
  const preferences = useState<AccountPreferences>('account-preferences', () => ({ ...DEFAULT_ACCOUNT_PREFERENCES }))
  const source = useState<'account' | 'guest' | 'none'>('account-preferences-source', () => 'none')
  const loaded = useState<boolean>('account-preferences-loaded', () => false)
  const saving = useState<boolean>('account-preferences-saving', () => false)
  const saveError = useState<boolean>('account-preferences-save-error', () => false)
  const { loggedIn } = useUserSession()

  async function loadAccount() {
    if (!loggedIn.value) return loadGuest()
    try {
      preferences.value = await $fetch<AccountPreferences>('/api/account/preferences')
      source.value = 'account'
      loaded.value = true
      saveError.value = false
    } catch {
      source.value = 'guest'
      loadGuest()
    }
  }

  function loadGuest() {
    preferences.value = { ...DEFAULT_ACCOUNT_PREFERENCES }
    if (import.meta.client) {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
        const savedSound = localStorage.getItem('puzzle-zimablue:sounds-enabled')
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<AccountPreferences>
          preferences.value = {
            ...preferences.value,
            showReferenceImage: typeof parsed.showReferenceImage === 'boolean' ? parsed.showReferenceImage : true,
            reduceMotion: typeof parsed.reduceMotion === 'boolean' ? parsed.reduceMotion : false,
            soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : savedSound === null ? true : savedSound === 'true',
            soundVolume: typeof parsed.soundVolume === 'number' && Number.isInteger(parsed.soundVolume)
              ? Math.max(0, Math.min(100, parsed.soundVolume))
              : 100,
            avatarVariant: isAvatarVariant(parsed.avatarVariant) ? parsed.avatarVariant : 'marble',
          }
        }
        else if (savedSound !== null) preferences.value.soundEnabled = savedSound === 'true'
      } catch {
        // Keep defaults if browser storage is unavailable or malformed.
      }
    }
    source.value = 'guest'
    loaded.value = true
  }

  async function save(changes: Partial<AccountPreferences> = {}): Promise<boolean> {
    saveError.value = false
    if (!import.meta.client) return false

    if (loggedIn.value && !loaded.value) await loadAccount()

    const next: AccountPreferences = { ...preferences.value, ...changes, avatarSeed: preferences.value.avatarSeed }
    preferences.value = next

    if (loggedIn.value) {
      saving.value = true
      try {
        preferences.value = await $fetch<AccountPreferences>('/api/account/preferences', { method: 'PUT', body: next })
        source.value = 'account'
        loaded.value = true
        return true
      } catch {
        saveError.value = true
        return false
      } finally {
        saving.value = false
      }
    }

    try {
      const { avatarSeed: _avatarSeed, ...guestPreferences } = preferences.value
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(guestPreferences))
    } catch {
      saveError.value = true
      return false
    }
    source.value = 'guest'
    loaded.value = true
    return true
  }

  function avatarUrl(variant = preferences.value.avatarVariant, size = 96) {
    const seed = preferences.value.avatarSeed
    if (!seed) return ''
    const query = new URLSearchParams({ variant, size: String(size), square: 'true' })
    return `https://tronche.cc/api/avatar/${encodeURIComponent(seed)}?${query.toString()}`
  }

  return { preferences, source, loaded, saving, saveError, loadAccount, loadGuest, save, avatarUrl }
}

function isAvatarVariant(value: unknown): value is TroncheAvatarVariant {
  return typeof value === 'string' && ['marble', 'bauhaus', 'beam', 'pixel', 'ring', 'sunset'].includes(value)
}
