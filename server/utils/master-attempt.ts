export interface WeeklyAttemptRow {
  attempt_id: string
  generation: number
  attempt: string
  status: 'in_progress' | 'completed' | 'forfeited'
  moves: number | null
  started_at: string
  completed_at: string | null
}

export function mapWeeklyAttempt(row: WeeklyAttemptRow) {
  return {
    status: row.status,
    attemptId: row.attempt_id,
    generation: row.generation,
    attempt: row.attempt,
    moves: row.moves,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  }
}
