-- =============================================================
-- Store Rating Platform — PostgreSQL schema
-- Idempotent: safe to run multiple times.
-- =============================================================

-- Roles are a closed set, so an ENUM gives integrity + compact storage.
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'USER', 'OWNER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Keeps updated_at accurate without relying on application code.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------
-- users: every account (admins, normal users, store owners)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(60)  NOT NULL CHECK (char_length(name) BETWEEN 20 AND 60),
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  address       VARCHAR(400) NOT NULL,
  role          user_role    NOT NULL DEFAULT 'USER',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
-- Case-insensitive uniqueness: "A@x.com" and "a@x.com" are the same person.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uq ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);
CREATE INDEX IF NOT EXISTS users_name_idx ON users (name);

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------
-- stores: a store has at most one owner, an owner at most one store
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stores (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(60)  NOT NULL CHECK (char_length(name) BETWEEN 20 AND 60),
  email      VARCHAR(255) NOT NULL,
  address    VARCHAR(400) NOT NULL,
  owner_id   INTEGER UNIQUE REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS stores_email_lower_uq ON stores (LOWER(email));
CREATE INDEX IF NOT EXISTS stores_name_idx ON stores (name);

DROP TRIGGER IF EXISTS stores_set_updated_at ON stores;
CREATE TRIGGER stores_set_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------
-- ratings: one rating per (user, store); re-rating updates the row
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ratings (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER  NOT NULL REFERENCES users (id)  ON DELETE CASCADE,
  store_id   INTEGER  NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ratings_user_store_uq UNIQUE (user_id, store_id)
);
CREATE INDEX IF NOT EXISTS ratings_store_idx ON ratings (store_id);

DROP TRIGGER IF EXISTS ratings_set_updated_at ON ratings;
CREATE TRIGGER ratings_set_updated_at BEFORE UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------
-- Aggregates live in a view so every query computes them the same way.
-- ---------------------------------------------------------------
CREATE OR REPLACE VIEW store_rating_summary AS
SELECT
  s.id                             AS store_id,
  ROUND(AVG(r.rating)::numeric, 2) AS avg_rating,
  COUNT(r.id)                      AS rating_count
FROM stores s
LEFT JOIN ratings r ON r.store_id = s.id
GROUP BY s.id;
