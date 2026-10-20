ALTER TABLE users ADD COLUMN preferred_language TEXT NOT NULL DEFAULT 'fr'
  CHECK (preferred_language IN ('fr', 'en'));
