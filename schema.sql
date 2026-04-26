-- ============================================================
-- SupportBot AI — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password      TEXT NOT NULL,
  name          TEXT NOT NULL,
  plan          TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  message_count INT DEFAULT 0,
  message_limit INT DEFAULT 100,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Bots table
CREATE TABLE IF NOT EXISTS bots (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name   TEXT NOT NULL,
  welcome_message TEXT DEFAULT 'Hi! How can I help you today?',
  instructions    TEXT DEFAULT '',
  theme_color     TEXT DEFAULT '#5b4cf6',
  faqs            JSONB DEFAULT '[]',
  embed_key       UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table (for usage tracking and analytics)
CREATE TABLE IF NOT EXISTS messages (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id       UUID REFERENCES bots(id) ON DELETE CASCADE,
  user_message TEXT,
  bot_reply    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bots_user_id ON bots(user_id);
CREATE INDEX IF NOT EXISTS idx_bots_embed_key ON bots(embed_key);
CREATE INDEX IF NOT EXISTS idx_messages_bot_id ON messages(bot_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Auto-update updated_at on bots
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bots_updated_at
  BEFORE UPDATE ON bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Monthly reset function (optional: call via cron)
-- You can set up a Supabase cron job to run this on the 1st of each month:
-- SELECT cron.schedule('reset-message-counts', '0 0 1 * *', 'SELECT reset_monthly_counts()');

CREATE OR REPLACE FUNCTION reset_monthly_counts()
RETURNS void AS $$
BEGIN
  UPDATE users SET message_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (optional but recommended)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
