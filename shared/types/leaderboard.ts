export interface LeaderboardPayload {
  scope: 'daily' | 'historical'
  puzzle: { date: string; title: string; titleEn: string; pieceCount: number } | null
  metrics: { participantCount: number; averageMoves: number | null; medianMoves: number | null; bestMoves: number | null; worstMoves: number | null } | null
  entries: { rank: number; ordinal: number; publicName: string; publicProfileToken: string | null; moves: number }[]
}
