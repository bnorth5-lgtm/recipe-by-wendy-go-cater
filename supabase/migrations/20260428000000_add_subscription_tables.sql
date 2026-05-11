-- Migration: Add subscription tier and usage tracking tables
-- Delicious Catering & Events — 2026-04-28

-- -----------------------------------------------------------------------
-- 1. Reference table: subscription tier definitions
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id          TEXT        PRIMARY KEY,  -- 'basic' | 'professional' | 'enterprise'
  label       TEXT        NOT NULL,
  tagline     TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.subscription_tiers (id, label, tagline, description) VALUES
  ('basic',
   'Basic',
   'Browse & Explore',
   'Read-only access to all menus and recipes.'),
  ('professional',
   'Professional',
   'Price Intelligence',
   'Everything in Basic plus URL/OCR recipe scraping and local market price lookups.'),
  ('enterprise',
   'Enterprise',
   'Full Agent Suite',
   'All Professional features plus AI agent tools, broad market pricing, and the Educational Bank.')
ON CONFLICT (id) DO UPDATE SET
  label       = EXCLUDED.label,
  tagline     = EXCLUDED.tagline,
  description = EXCLUDED.description;

-- -----------------------------------------------------------------------
-- 2. Subscriber profiles — one row per application user
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriber_profiles (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL UNIQUE,  -- local Zustand user ID (e.g. "u1")
  email         TEXT,
  tier          TEXT        NOT NULL DEFAULT 'basic'
                            REFERENCES public.subscription_tiers(id),
  subscribed_at TIMESTAMPTZ,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriber_profiles_user_id
  ON public.subscriber_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriber_profiles_tier
  ON public.subscriber_profiles(tier);

-- -----------------------------------------------------------------------
-- 3. Feature usage log — every time a gated feature is accessed
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriber_usage (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT        NOT NULL,
  feature      TEXT        NOT NULL,  -- TierFeature key, e.g. 'price_scraping'
  tier_at_time TEXT        NOT NULL,  -- tier the user held when accessing
  accessed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata     JSONB                  -- optional context (page, source, etc.)
);

CREATE INDEX IF NOT EXISTS idx_subscriber_usage_user_id
  ON public.subscriber_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriber_usage_feature
  ON public.subscriber_usage(feature);

CREATE INDEX IF NOT EXISTS idx_subscriber_usage_accessed_at
  ON public.subscriber_usage(accessed_at DESC);

-- -----------------------------------------------------------------------
-- 4. Seed demo subscriber profiles to match initialUsers in cateringStore
-- -----------------------------------------------------------------------
INSERT INTO public.subscriber_profiles (user_id, email, tier, subscribed_at, is_active)
VALUES
  ('u1', 'alice@example.com',   'enterprise',   NOW(), TRUE),
  ('u2', 'bob@example.com',     'professional', NOW(), TRUE),
  ('u3', 'charlie@example.com', 'basic',        NULL,  TRUE)
ON CONFLICT (user_id) DO UPDATE SET
  tier       = EXCLUDED.tier,
  updated_at = NOW();

-- -----------------------------------------------------------------------
-- 5. Row Level Security (RLS) — enable but default to permissive for now
--    Tighten these policies when Supabase Auth is wired up.
-- -----------------------------------------------------------------------
ALTER TABLE public.subscription_tiers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriber_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriber_usage       ENABLE ROW LEVEL SECURITY;

-- Public read access to the tiers reference table (always safe)
CREATE POLICY "tiers_public_read"
  ON public.subscription_tiers FOR SELECT
  USING (true);

-- Profiles: allow anon read/write via service role (tighten with auth later)
CREATE POLICY "profiles_service_all"
  ON public.subscriber_profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- Usage: allow anon insert/read via service role (tighten with auth later)
CREATE POLICY "usage_service_all"
  ON public.subscriber_usage FOR ALL
  USING (true)
  WITH CHECK (true);
