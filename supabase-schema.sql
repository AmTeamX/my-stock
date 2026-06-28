-- ============================================
-- MyStock — Supabase Schema v2 (Multi-Ward)
-- ============================================

-- Wards (กลุ่ม/วอร์ด)
CREATE TABLE IF NOT EXISTS wards (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ward members
CREATE TABLE IF NOT EXISTS ward_members (
  ward_id      TEXT NOT NULL REFERENCES wards(id),
  user_id      TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ward_id, user_id)
);

-- Stock items (per ward)
CREATE TABLE IF NOT EXISTS stocks (
  id            TEXT NOT NULL,
  ward_id       TEXT NOT NULL REFERENCES wards(id),
  name          TEXT NOT NULL,
  quantity      INTEGER NOT NULL DEFAULT 0,
  unit          TEXT NOT NULL DEFAULT 'ชิ้น',
  min_threshold INTEGER NOT NULL DEFAULT 10,
  category      TEXT NOT NULL DEFAULT 'อื่นๆ',
  image_url     TEXT DEFAULT '',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, ward_id)
);

-- Transaction log (per ward)
CREATE TABLE IF NOT EXISTS transactions (
  id          TEXT PRIMARY KEY,
  ward_id     TEXT NOT NULL REFERENCES wards(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  stock_name  TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('add', 'withdraw')),
  quantity    INTEGER NOT NULL,
  user_id     TEXT NOT NULL,
  note        TEXT DEFAULT ''
);

-- User notification preference
CREATE TABLE IF NOT EXISTS user_settings (
  user_id    TEXT PRIMARY KEY,
  notify     BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS off
ALTER TABLE wards DISABLE ROW LEVEL SECURITY;
ALTER TABLE ward_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE stocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stocks_ward ON stocks (ward_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ward ON transactions (ward_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ward_members_user ON ward_members (user_id);
