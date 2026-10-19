export type PuzzleStatus = 'draft' | 'published'

export interface DailyPuzzle {
  puzzleId: string
  date: string
  title: string
  note: string
  titleEn: string
  noteEn: string
  imageName: string
  imageSlug: string
  imageUrl: string
  imageDescription: string
  gridSize: number
  gridRows: number
  gridColumns: number
  pieceCount: number
  status: PuzzleStatus
}

/** Published weekly Master puzzle. The square source image is shared across all devices. */
export interface WeeklyPuzzle {
  puzzleId: string
  weekKey: string
  weekStart: string
  title: string
  note: string
  titleEn: string
  noteEn: string
  imageName: string
  imageSlug: string
  imageUrl: string
  imageDescription: string
  imageUrlLandscape: string | null
  imageUrlPortrait: string | null
  imageUrlSquare: string | null
  gridRows: number
  gridColumns: number
  pieceCount: number
  status: PuzzleStatus
}

export function formatPuzzleDate(date: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'full' }, locale = 'fr-FR'): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'Europe/Paris' })
    .format(new Date(`${date}T12:00:00+02:00`))
}
