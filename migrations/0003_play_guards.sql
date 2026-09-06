-- Additive: existing play_events and hourly popularity windows stay intact.
CREATE TABLE IF NOT EXISTS play_guard_key (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  secret TEXT NOT NULL
);
INSERT OR IGNORE INTO play_guard_key (id, secret)
VALUES (1, lower(hex(randomblob(32))));

-- Only daily HMAC pseudonyms; never raw IPs or video/content identifiers.
CREATE TABLE IF NOT EXISTS play_attempts (
  request_id TEXT PRIMARY KEY NOT NULL,
  ip_key TEXT NOT NULL,
  video_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  accepted INTEGER NOT NULL CHECK (accepted IN (0, 1))
);
CREATE INDEX IF NOT EXISTS play_attempts_ip_time ON play_attempts(ip_key, created_at);
CREATE INDEX IF NOT EXISTS play_attempts_video_time ON play_attempts(video_key, created_at) WHERE accepted = 1;
CREATE INDEX IF NOT EXISTS play_attempts_time ON play_attempts(created_at);
