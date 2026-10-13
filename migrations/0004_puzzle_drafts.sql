CREATE TABLE puzzle_drafts (
  date TEXT PRIMARY KEY NOT NULL,
  source_date TEXT,
  payload_json TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_puzzle_drafts_source_date ON puzzle_drafts(source_date);
