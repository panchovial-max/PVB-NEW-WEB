-- Migration: Create oauth_states table for secure OAuth flow
-- Run this in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS oauth_states (
  nonce TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  session_token TEXT NOT NULL,
  platform TEXT NOT NULL,
  extra TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup of expired nonces
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);

-- Auto-cleanup: delete expired nonces (run periodically or via pg_cron)
-- Optional: enable pg_cron extension and schedule this
-- SELECT cron.schedule('cleanup-oauth-states', '*/10 * * * *', $$DELETE FROM oauth_states WHERE expires_at < NOW()$$);

-- RLS: only service_role should access this table (Netlify functions use service key)
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
-- No policies = only service_role key can access (which is what we want)
