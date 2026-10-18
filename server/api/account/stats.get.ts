import { getDatabase } from '../../utils/cloudflare'
import { requireSignedInUser } from '../../utils/auth'
import { getVerifiedPlayerStats } from '../../utils/player-stats'

interface CompletionRow { puzzle_date: string; moves: number; completed_at: string }

export default defineEventHandler(async (event) => {
  const user = await requireSignedInUser(event)
  const database = getDatabase(event)
  const activeUser = await database.prepare('SELECT id, public_name, public_profile_token FROM users WHERE id = ? AND disabled_at IS NULL AND email_verified_at IS NOT NULL')
    .bind(user.id).first<{ id: string; public_name: string | null; public_profile_token: string | null }>()
  if (!activeUser) {
    await clearUserSession(event)
    throw createError({ statusCode: 403, statusMessage: 'Session invalide.' })
  }
  const [rows, verifiedStats] = await Promise.all([
    database.prepare('SELECT puzzle_date, moves, completed_at FROM puzzle_completions WHERE user_id = ? ORDER BY puzzle_date DESC')
      .bind(user.id)
      .all<CompletionRow>(),
    getVerifiedPlayerStats(database, user.id),
  ])
  const completions = rows.results ?? []
  const completedDates = new Set(completions.map(row => row.puzzle_date))
  let streak = 0
  const dateParts = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const part = (type: string) => dateParts.find(value => value.type === type)?.value ?? ''
  const today = `${part('year')}-${part('month')}-${part('day')}`
  const yesterday = new Date(`${today}T12:00:00+01:00`)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  let cursorDate = completedDates.has(today) ? today : yesterday.toISOString().slice(0, 10)
  while (completedDates.has(cursorDate)) {
    streak += 1
    const previous = new Date(`${cursorDate}T12:00:00+01:00`)
    previous.setUTCDate(previous.getUTCDate() - 1)
    cursorDate = previous.toISOString().slice(0, 10)
  }
  const lowestMoves = completions.length ? Math.min(...completions.map(row => row.moves)) : null
  return {
    publicName: activeUser.public_name ?? '',
    publicProfileToken: activeUser.public_profile_token,
    completedCount: completions.length,
    currentStreak: streak,
    bestMoves: lowestMoves,
    verifiedStats,
    completions: completions.map(row => ({ puzzleDate: row.puzzle_date, moves: row.moves, completedAt: row.completed_at })),
  }
})
