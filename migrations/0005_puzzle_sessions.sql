CREATE TABLE puzzle_sessions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puzzle_date TEXT NOT NULL REFERENCES puzzles(date) ON DELETE CASCADE,
  attempt TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, puzzle_date)
);
