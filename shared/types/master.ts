import type { WeeklyPuzzle } from './puzzle'

export type MasterAttemptStatus = 'available' | 'in_progress' | 'completed' | 'forfeited' | 'practice'

export interface MasterAttemptSnapshot {
  status: MasterAttemptStatus
  attemptId: string | null
  generation: number | null
  moves: number | null
  startedAt: string | null
  completedAt: string | null
}

export interface MasterLeaderboardPayload {
  puzzle: Pick<WeeklyPuzzle, 'puzzleId' | 'weekKey' | 'weekStart' | 'title' | 'titleEn' | 'pieceCount'>
  metrics: { participantCount: number; averageMoves: number | null; medianMoves: number | null; bestMoves: number | null; worstMoves: number | null }
  entries: { rank: number; ordinal: number; publicName: string; publicProfileToken: string | null; moves: number }[]
}
