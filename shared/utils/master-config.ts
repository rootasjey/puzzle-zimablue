export const MASTER_GRID_SIZES = [16, 20] as const
export type MasterGridSize = typeof MASTER_GRID_SIZES[number]

export function isMasterGridSize(value: unknown): value is MasterGridSize {
  return typeof value === 'number' && MASTER_GRID_SIZES.includes(value as MasterGridSize)
}

export function isZimablueImageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'zimablue.cc' && url.pathname.startsWith('/images/')
  } catch {
    return false
  }
}
