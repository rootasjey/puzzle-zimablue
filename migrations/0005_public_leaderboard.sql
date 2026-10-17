ALTER TABLE users ADD COLUMN public_name TEXT;

ALTER TABLE puzzle_completions ADD COLUMN score_verified INTEGER NOT NULL DEFAULT 0 CHECK (score_verified IN (0, 1));
CREATE INDEX puzzle_completions_leaderboard_idx ON puzzle_completions(puzzle_date, score_verified, moves, completed_at);

ALTER TABLE email_verification_tokens ADD COLUMN pending_score_verified INTEGER NOT NULL DEFAULT 0 CHECK (pending_score_verified IN (0, 1));
