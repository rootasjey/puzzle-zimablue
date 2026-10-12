CREATE TABLE puzzle_completions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puzzle_date TEXT NOT NULL REFERENCES puzzles(date) ON DELETE CASCADE,
  moves INTEGER NOT NULL CHECK (moves >= 0),
  completed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, puzzle_date)
);

CREATE INDEX puzzle_completions_date_idx ON puzzle_completions(puzzle_date, completed_at);

CREATE TABLE email_verification_tokens (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  pending_puzzle_date TEXT REFERENCES puzzles(date) ON DELETE SET NULL,
  pending_moves INTEGER CHECK (pending_moves IS NULL OR pending_moves >= 0),
  created_at TEXT NOT NULL
);

CREATE INDEX email_verification_user_idx ON email_verification_tokens(user_id, created_at);
