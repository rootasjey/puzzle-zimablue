ALTER TABLE puzzles ADD COLUMN grid_rows INTEGER NOT NULL DEFAULT 3 CHECK (grid_rows BETWEEN 2 AND 32);
ALTER TABLE puzzles ADD COLUMN grid_columns INTEGER NOT NULL DEFAULT 3 CHECK (grid_columns BETWEEN 2 AND 32);
UPDATE puzzles SET grid_rows = grid_size, grid_columns = grid_size;

-- V1 sessions are intentionally discarded as part of the approved save-format break.
DROP TABLE puzzle_sessions;
CREATE TABLE puzzle_sessions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puzzle_id TEXT NOT NULL CHECK (puzzle_id LIKE 'daily:%' OR puzzle_id LIKE 'master:%'),
  attempt TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, puzzle_id)
);

CREATE TABLE weekly_puzzles (
  puzzle_id TEXT PRIMARY KEY NOT NULL CHECK (puzzle_id LIKE 'master:%'),
  week_key TEXT NOT NULL UNIQUE,
  week_start TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  note_en TEXT NOT NULL DEFAULT '',
  image_name TEXT NOT NULL,
  image_slug TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_url_landscape TEXT,
  image_url_portrait TEXT,
  image_url_square TEXT,
  grid_rows INTEGER NOT NULL CHECK (grid_rows BETWEEN 2 AND 32),
  grid_columns INTEGER NOT NULL CHECK (grid_columns BETWEEN 2 AND 32),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (grid_rows * grid_columns <= 1024)
);

CREATE INDEX weekly_puzzles_status_week_idx ON weekly_puzzles(status, week_start);
