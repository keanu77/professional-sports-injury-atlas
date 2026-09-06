CREATE TABLE IF NOT EXISTS play_events (
  event_id TEXT PRIMARY KEY NOT NULL,
  video_id TEXT NOT NULL,
  played_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS play_events_time_video ON play_events(played_at, video_id);
