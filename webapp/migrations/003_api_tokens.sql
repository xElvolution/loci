-- Bearer tokens for the mobile API (/api/v1). Only a SHA-256 of the token is stored.
CREATE TABLE IF NOT EXISTS api_tokens (
  id           text PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label        text NOT NULL DEFAULT 'mobile',
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  expires_at   timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS api_tokens_user_idx ON api_tokens (user_id);
