ALTER TABLE users ADD COLUMN public_profile_token TEXT;

CREATE UNIQUE INDEX users_public_profile_token_idx ON users(public_profile_token);
