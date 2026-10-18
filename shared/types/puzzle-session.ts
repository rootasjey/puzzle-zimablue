export interface PuzzleSessionSnapshot {
  revision: number
  attempt: string
  updatedAt: string
}

export interface LocalPuzzleSession {
  version: 2
  puzzleId: string
  gridRows: number
  gridColumns: number
  attempt: string
  savedAt: number
}
