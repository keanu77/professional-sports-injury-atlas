-- Separate from playback events; no raw IP addresses or submitted text.
CREATE TABLE IF NOT EXISTS contribution_guard_key (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  secret TEXT NOT NULL
);
INSERT OR IGNORE INTO contribution_guard_key (id, secret)
VALUES (1, lower(hex(randomblob(32))));

CREATE TABLE IF NOT EXISTS contribution_attempts (
  request_id TEXT PRIMARY KEY NOT NULL,
  ip_key TEXT NOT NULL,
  content_key TEXT NOT NULL,
  day INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('pending', 'sent', 'uncertain', 'rejected'))
);
CREATE INDEX IF NOT EXISTS contribution_ip_day ON contribution_attempts(ip_key, day);
CREATE INDEX IF NOT EXISTS contribution_day_state ON contribution_attempts(day, state);
CREATE INDEX IF NOT EXISTS contribution_content_time ON contribution_attempts(content_key, created_at);
