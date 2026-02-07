-- FloodMentor Observations Table
CREATE TABLE IF NOT EXISTS observations (
  observation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  input_mode TEXT NOT NULL CHECK (input_mode IN ('voice', 'text')),
  raw_text TEXT NOT NULL,
  transcript_confidence REAL,
  audio_storage_path TEXT,
  processing_status TEXT NOT NULL DEFAULT 'ready' CHECK (processing_status IN ('recording', 'transcribing', 'extracting', 'ready', 'synced', 'failed')),
  context JSONB NOT NULL,
  extracted JSONB
);

-- Enable Row Level Security
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write for demo (tighten this later with auth)
CREATE POLICY "Allow anonymous access" ON observations
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_observations_created_at ON observations(created_at DESC);
