export type PuzzleStatus = 'draft' | 'published'

export interface DailyPuzzle {
  date: string
  title: string
  note: string
  imageName: string
  imageSlug: string
  imageUrl: string
  gridSize: number
  status: PuzzleStatus
}

export function formatPuzzleDate(date: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'full' }): string {
  return new Intl.DateTimeFormat('fr-FR', { ...options, timeZone: 'Europe/Paris' })
    .format(new Date(`${date}T12:00:00+02:00`))
}
