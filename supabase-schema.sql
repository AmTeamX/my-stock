-- ============================================
-- MyStock — Supabase Schema
-- ============================================

-- Stock items
CREATE TABLE stocks (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 0,
  unit        TEXT NOT NULL DEFAULT 'ชิ้น',
  min_threshold INTEGER NOT NULL DEFAULT 10,
  category    TEXT NOT NULL DEFAULT 'อื่นๆ',
  image_url   TEXT DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transaction log
CREATE TABLE transactions (
  id          TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  stock_name  TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('add', 'withdraw')),
  quantity    INTEGER NOT NULL,
  user_id     TEXT NOT NULL DEFAULT 'unknown',
  note        TEXT DEFAULT ''
);

-- Settings (key-value)
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('enabled', 'true'),
  ('threshold', '10'),
  ('recipientUserIds', ''),
  ('notifyAllGroupMembers', 'false');

-- Indexes
CREATE INDEX idx_transactions_created_at ON transactions (created_at DESC);
CREATE INDEX idx_stocks_category ON stocks (category);
CREATE INDEX idx_stocks_name ON stocks (name);

-- Storage bucket for images (run in Supabase SQL Editor or Dashboard)
-- Then from Dashboard: Storage → New Bucket → "stock-images" → Public
