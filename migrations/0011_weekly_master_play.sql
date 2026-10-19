CREATE TABLE weekly_puzzle_attempts (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puzzle_id TEXT NOT NULL REFERENCES weekly_puzzles(puzzle_id) ON DELETE CASCADE,
  attempt_id TEXT NOT NULL UNIQUE,
  generation INTEGER NOT NULL CHECK (generation BETWEEN 0 AND 2000),
  attempt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'forfeited')),
  moves INTEGER CHECK (moves IS NULL OR moves > 0),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  PRIMARY KEY (user_id, puzzle_id),
  CHECK ((status = 'in_progress' AND moves IS NULL AND completed_at IS NULL)
    OR (status = 'completed' AND moves IS NOT NULL AND completed_at IS NOT NULL)
    OR (status = 'forfeited' AND moves IS NULL AND completed_at IS NULL))
);

CREATE INDEX weekly_puzzle_attempts_leaderboard_idx
  ON weekly_puzzle_attempts(puzzle_id, status, moves, completed_at);
