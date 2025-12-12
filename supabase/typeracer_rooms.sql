-- TypeRacer Multiplayer Rooms Table
-- Run this in your Supabase SQL editor to create the required table

CREATE TABLE IF NOT EXISTS typeracer_rooms (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  start_time TIMESTAMPTZ,
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE typeracer_rooms ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read rooms
CREATE POLICY "Anyone can read rooms"
  ON typeracer_rooms
  FOR SELECT
  USING (true);

-- Policy to allow anyone to insert rooms
CREATE POLICY "Anyone can create rooms"
  ON typeracer_rooms
  FOR INSERT
  WITH CHECK (true);

-- Policy to allow anyone to update rooms (for multiplayer updates)
CREATE POLICY "Anyone can update rooms"
  ON typeracer_rooms
  FOR UPDATE
  USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE typeracer_rooms;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_typeracer_rooms_status ON typeracer_rooms(status);
CREATE INDEX IF NOT EXISTS idx_typeracer_rooms_created_at ON typeracer_rooms(created_at);

-- Optional: Auto-cleanup old rooms (older than 1 hour)
-- You can set up a scheduled function to run this
-- DELETE FROM typeracer_rooms WHERE created_at < NOW() - INTERVAL '1 hour';
