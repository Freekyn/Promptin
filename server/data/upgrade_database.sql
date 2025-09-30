-- Add missing columns to frameworks table
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS domain_tags TEXT;
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS complexity_level TEXT DEFAULT 'medium';
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS platforms TEXT;
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS models TEXT;
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS relevance_score INTEGER DEFAULT 0;
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT 0;
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Create feedback table for learning
CREATE TABLE IF NOT EXISTS user_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_hash TEXT NOT NULL,
  user_request TEXT NOT NULL,
  framework_id INTEGER,
  intent TEXT,
  rating INTEGER,
  feedback_text TEXT,
  recommendations TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (framework_id) REFERENCES frameworks (id)
);

-- Create dynamic frameworks table
CREATE TABLE IF NOT EXISTS dynamic_frameworks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  base_prompt TEXT,
  methodology TEXT,
  key_principles TEXT,
  success_metrics TEXT,
  domain_tags TEXT,
  complexity_level TEXT,
  output_formats TEXT,
  platforms TEXT,
  models TEXT,
  confidence_score INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  usage_count INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_request ON user_feedback(request_hash);
CREATE INDEX IF NOT EXISTS idx_frameworks_domain ON frameworks(domain_tags);
CREATE INDEX IF NOT EXISTS idx_frameworks_complexity ON frameworks(complexity_level);