export interface PuzzleSessionSnapshot {
  revision: number
  attempt: string
  updatedAt: string
}

export interface LocalPuzzleSession {
  version: 1
  date: string
  gridSize: number
  attempt: string
  savedAt: number
}
