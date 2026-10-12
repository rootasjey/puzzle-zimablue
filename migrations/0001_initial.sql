PRAGMA foreign_keys = ON;

CREATE TABLE puzzles (
  date TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  image_name TEXT NOT NULL,
  image_slug TEXT NOT NULL,
  image_url TEXT NOT NULL,
  grid_size INTEGER NOT NULL DEFAULT 3 CHECK (grid_size BETWEEN 2 AND 8),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX puzzles_status_date_idx ON puzzles(status, date);

CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  email_verified_at TEXT,
  disabled_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX password_reset_user_idx ON password_reset_tokens(user_id, created_at);

CREATE TABLE auth_rate_limits (
  key TEXT PRIMARY KEY NOT NULL,
  window_started INTEGER NOT NULL,
  attempts INTEGER NOT NULL
);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

INSERT INTO app_settings (key, value) VALUES ('admin_bootstrap_complete', '0');

INSERT INTO puzzles (date, title, note, image_name, image_slug, image_url, grid_size, status, created_at, updated_at)
VALUES
  ('2026-10-12', 'Soleil Pour Deux', 'Viens, je t’emmène dans mon paradis bleu.', 'Soleil Pour Deux', 'soleil-deuxjpg-ml6qmt92b8s', 'https://zimablue.cc/images/soleil-deux-ml6qmgipvcj.jpeg/md.jpeg', 3, 'published', '2026-10-12T00:00:00.000Z', '2026-10-12T00:00:00.000Z'),
  ('2026-10-11', 'Biscotte Paper Plane', 'Biscotte prend son envol.', 'Biscotte Paper Plane', 'breakfastclub-biscottepaperplanejpg-mjz3hk0vnxf', 'https://zimablue.cc/images/breakfastclub-biscottepaperplane-mjz3hegxw1u.jpeg/md.jpeg', 3, 'published', '2026-10-11T00:00:00.000Z', '2026-10-11T00:00:00.000Z'),
  ('2026-10-10', 'Astronaute', 'Une petite escapade dans l’espace.', 'Astronaute', 'astronautejpg-mbkxy9n0pl6', 'https://zimablue.cc/images/astronaute-mbkxy5vj0kr.jpeg/md.jpeg', 3, 'published', '2026-10-10T00:00:00.000Z', '2026-10-10T00:00:00.000Z');
