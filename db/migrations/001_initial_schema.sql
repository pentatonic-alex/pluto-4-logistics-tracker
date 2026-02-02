-- Events table (TES-like event store)
-- This is the source of truth - all state is derived from events
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  stream_type TEXT NOT NULL,
  stream_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_stream ON events(stream_type, stream_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);

-- Campaign projections (materialized current state)
-- This is updated by event handlers and used for fast queries
CREATE TABLE IF NOT EXISTS campaign_projections (
  id TEXT PRIMARY KEY,
  lego_campaign_code TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  current_step TEXT,
  current_weight_kg DECIMAL,
  material_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_event_type TEXT,
  last_event_at TIMESTAMP WITH TIME ZONE,
  next_expected_step TEXT,
  echa_approved BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaign_projections(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_lego_code ON campaign_projections(lego_campaign_code);
