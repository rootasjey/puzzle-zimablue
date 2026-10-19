const DAY_MS = 24 * 60 * 60 * 1000

export function isValidIsoWeekKey(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = /^(\d{4})-w(0[1-9]|[1-4]\d|5[0-3])$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const week = Number(match[2])
  if (year < 1) return false
  const janFourth = new Date(Date.UTC(year, 0, 4))
  const weekOneMonday = new Date(Date.UTC(year, 0, 4 - ((janFourth.getUTCDay() + 6) % 7)))
  const targetMonday = new Date(weekOneMonday.getTime() + (week - 1) * 7 * DAY_MS)
  const targetThursday = new Date(targetMonday.getTime() + 3 * DAY_MS)
  const targetYear = targetThursday.getUTCFullYear()
  const targetJanFourth = new Date(Date.UTC(targetYear, 0, 4))
  const targetWeekOneMonday = new Date(Date.UTC(targetYear, 0, 4 - ((targetJanFourth.getUTCDay() + 6) % 7)))
  const targetWeek = Math.floor((targetMonday.getTime() - targetWeekOneMonday.getTime()) / (7 * DAY_MS)) + 1
  return targetYear === year && targetWeek === week
}

export function getIsoWeekKeyForDate(date: string): string {
  if (!isIsoDate(date)) throw new RangeError('Invalid ISO date.')
  const value = new Date(`${date}T12:00:00Z`)
  const monday = new Date(value)
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))
  const thursday = new Date(monday)
  thursday.setUTCDate(thursday.getUTCDate() + 3)
  const isoYear = thursday.getUTCFullYear()
  const janFourth = new Date(Date.UTC(isoYear, 0, 4))
  const weekOneMonday = new Date(Date.UTC(isoYear, 0, 4 - ((janFourth.getUTCDay() + 6) % 7)))
  const week = Math.floor((monday.getTime() - weekOneMonday.getTime()) / (7 * DAY_MS)) + 1
  return `${isoYear}-w${String(week).padStart(2, '0')}`
}

export function getIsoWeekStart(weekKey: string): string {
  if (!isValidIsoWeekKey(weekKey)) throw new RangeError('Invalid ISO week key.')
  const [yearText, weekText] = weekKey.split('-w')
  const year = Number(yearText)
  const week = Number(weekText)
  const janFourth = new Date(Date.UTC(year, 0, 4))
  const monday = new Date(Date.UTC(year, 0, 4 - ((janFourth.getUTCDay() + 6) % 7) + (week - 1) * 7))
  return monday.toISOString().slice(0, 10)
}

export function getIsoWeekKeyFromMonday(date: string): string {
  if (!isIsoDate(date) || new Date(`${date}T12:00:00Z`).getUTCDay() !== 1) {
    throw new RangeError('ISO week start must be a Monday.')
  }
  return getIsoWeekKeyForDate(date)
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T12:00:00Z`))
    && new Date(`${value}T12:00:00Z`).toISOString().startsWith(value)
}
