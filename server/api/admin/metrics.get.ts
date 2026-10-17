import { getDatabase } from '../../utils/cloudflare'
import { requireAdmin } from '../../utils/auth'
import { getParisDate } from '../../utils/puzzles'

const PERIOD_DAYS = 30
const PARIS_DATE_PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

interface DailyMetricRow {
  day_date: string
  completions: number
  players: number
  verified_scores: number
  verified_moves_total: number
  average_moves: number | null
  best_moves: number | null
}

interface ActivePlayerRow {
  active_players: number
}

function addDays(date: string, days: number): string {
  const value = new Date(date + 'T12:00:00.000Z')
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

/** Returns the UTC instant corresponding to midnight in Paris on the given date. */
function getParisMidnight(date: string): Date {
  const utcMidnight = new Date(date + 'T00:00:00.000Z')
  const parts = Object.fromEntries(PARIS_DATE_PARTS.formatToParts(utcMidnight).map(part => [part.type, part.value]))
  const parisClockAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
  )
  return new Date(utcMidnight.getTime() - (parisClockAsUtc - utcMidnight.getTime()))
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const today = getParisDate()
  const firstDay = addDays(today, -(PERIOD_DAYS - 1))
  const days = Array.from({ length: PERIOD_DAYS }, (_, index) => addDays(firstDay, index))
  const ranges = days.map((day) => {
    const start = getParisMidnight(day).toISOString()
    const end = getParisMidnight(addDays(day, 1)).toISOString()
    return { day, start, end }
  })

  const valuesSql = ranges.map(() => '(?, ?, ?)').join(', ')
  const dailySql = [
    'WITH days(day_date, day_start, day_end) AS (VALUES ' + valuesSql + ')',
    'SELECT days.day_date,',
    '  COUNT(completions.user_id) AS completions,',
    '  COUNT(DISTINCT completions.user_id) AS players,',
    '  SUM(CASE WHEN completions.score_verified = 1 THEN 1 ELSE 0 END) AS verified_scores,',
    '  SUM(CASE WHEN completions.score_verified = 1 THEN completions.moves ELSE 0 END) AS verified_moves_total,',
    '  ROUND(AVG(CASE WHEN completions.score_verified = 1 THEN completions.moves END), 1) AS average_moves,',
    '  MIN(CASE WHEN completions.score_verified = 1 THEN completions.moves END) AS best_moves',
    'FROM days',
    'LEFT JOIN (',
    '  SELECT puzzle_completions.user_id, puzzle_completions.completed_at, puzzle_completions.moves, puzzle_completions.score_verified',
    '  FROM puzzle_completions',
    '  JOIN users ON users.id = puzzle_completions.user_id',
    '  WHERE users.disabled_at IS NULL AND users.email_verified_at IS NOT NULL',
    '    AND puzzle_completions.completed_at >= ? AND puzzle_completions.completed_at < ?',
    ') AS completions',
    '  ON completions.completed_at >= days.day_start AND completions.completed_at < days.day_end',
    'GROUP BY days.day_date',
    'ORDER BY days.day_date DESC',
  ].join('\n')
  const rangeParams = [
    ...ranges.flatMap(range => [range.day, range.start, range.end]),
    ranges[0]!.start,
    ranges[ranges.length - 1]!.end,
  ]
  const activePlayersSql = [
    'SELECT COUNT(DISTINCT puzzle_completions.user_id) AS active_players',
    'FROM puzzle_completions',
    'JOIN users ON users.id = puzzle_completions.user_id',
    'WHERE users.disabled_at IS NULL AND users.email_verified_at IS NOT NULL',
    '  AND puzzle_completions.completed_at >= ? AND puzzle_completions.completed_at < ?',
  ].join('\n')
  const database = getDatabase(event)

  const [dailyResult, activePlayers] = await Promise.all([
    database.prepare(dailySql).bind(...rangeParams).all<DailyMetricRow>(),
    database.prepare(activePlayersSql)
      .bind(ranges[0]!.start, ranges[ranges.length - 1]!.end)
      .first<ActivePlayerRow>(),
  ])

  const rows = dailyResult.results ?? []
  const daysWithMetrics = rows.map(row => ({
    date: row.day_date,
    completions: row.completions,
    players: row.players,
    verifiedScores: row.verified_scores,
    averageMoves: row.average_moves,
    bestMoves: row.best_moves,
  }))
  const totals = rows.reduce((result, row) => ({
    completions: result.completions + row.completions,
    verifiedScores: result.verifiedScores + row.verified_scores,
    verifiedMoves: result.verifiedMoves + row.verified_moves_total,
  }), { completions: 0, verifiedScores: 0, verifiedMoves: 0 })

  return {
    period: { startDate: firstDay, endDate: today, days: PERIOD_DAYS },
    totals: {
      activePlayers: activePlayers?.active_players ?? 0,
      completions: totals.completions,
      verifiedScores: totals.verifiedScores,
      averageMoves: totals.verifiedScores ? Math.round(totals.verifiedMoves / totals.verifiedScores * 10) / 10 : null,
    },
    days: daysWithMetrics,
  }
})
