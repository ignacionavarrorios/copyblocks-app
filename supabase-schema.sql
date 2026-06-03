-- Run this in your Supabase project → SQL Editor

-- 1. Brand data (one row per user, full JSON blob)
CREATE TABLE brands_data (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  data    JSONB NOT NULL DEFAULT '{"brands":[]}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE brands_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_brands" ON brands_data FOR ALL USING (auth.uid() = user_id);

-- 2. Per-user Claude connection settings
CREATE TABLE user_settings (
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  claude_mode TEXT NOT NULL DEFAULT 'apikey',  -- 'apikey' | 'mcp'
  claude_mcp_url TEXT DEFAULT 'http://localhost:3001',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- Note: API keys are stored in the user's browser localStorage only,
-- never in Supabase, for security.
