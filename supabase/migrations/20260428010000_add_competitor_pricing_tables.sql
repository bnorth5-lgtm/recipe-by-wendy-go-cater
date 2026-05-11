-- Competitor pricing feed, master menu price history, and pricing rules
-- Delicious Catering & Events — 2026-04-28

-- -----------------------------------------------------------------------
-- 1. Competitor pricing feed
--    Stores scraped / manually-entered competitor price data per line item.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.competitor_pricing (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name       TEXT          NOT NULL,
  category        TEXT          NOT NULL DEFAULT 'per_person',
  price_per_unit  NUMERIC(10,2) NOT NULL,
  unit            TEXT          NOT NULL DEFAULT 'per_person',
  competitor_name TEXT,
  source_url      TEXT,
  region          TEXT          NOT NULL DEFAULT 'local',
  captured_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_competitor_pricing_item
  ON public.competitor_pricing(item_name);
CREATE INDEX IF NOT EXISTS idx_competitor_pricing_category
  ON public.competitor_pricing(category);
CREATE INDEX IF NOT EXISTS idx_competitor_pricing_active
  ON public.competitor_pricing(is_active) WHERE is_active = TRUE;

-- -----------------------------------------------------------------------
-- 2. Menu price history
--    Append-only audit trail of every price adjustment applied to the
--    master menu.  Never deleted — use is_active flags on parent records
--    instead.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_price_history (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id           TEXT          NOT NULL,   -- recipe.id or menu.id
  item_name         TEXT          NOT NULL,
  item_type         TEXT          NOT NULL,   -- 'recipe' | 'menu'
  old_price         NUMERIC(10,2),            -- null on first-ever pricing
  new_price         NUMERIC(10,2) NOT NULL,
  price_type        TEXT          NOT NULL DEFAULT 'per_serving',
  multiplier_used   NUMERIC(6,4)  NOT NULL,   -- the competitor_multiplier applied
  competitor_avg    NUMERIC(10,2),            -- null if no competitor match found
  adjustment_reason TEXT,
  applied_by        TEXT,                     -- user_id from subscriber_profiles
  applied_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_price_history_item
  ON public.menu_price_history(item_id);
CREATE INDEX IF NOT EXISTS idx_menu_price_history_at
  ON public.menu_price_history(applied_at DESC);

-- -----------------------------------------------------------------------
-- 3. Pricing rules
--    Named multiplier configurations.  Only one row has is_active = TRUE
--    at any time (enforced by application logic).
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name             TEXT         NOT NULL UNIQUE,
  competitor_multiplier NUMERIC(6,4) NOT NULL DEFAULT 1.15,
  min_margin_pct        NUMERIC(6,4) NOT NULL DEFAULT 0.30,
  max_premium_pct       NUMERIC(6,4) NOT NULL DEFAULT 2.00,
  category_overrides    JSONB,
  is_active             BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed: "Wendy Standard" rule — price 15 % above competitor average,
-- never below 30 % gross margin, never more than 2× competitor average.
INSERT INTO public.pricing_rules
  (rule_name, competitor_multiplier, min_margin_pct, max_premium_pct, is_active)
VALUES
  ('Wendy Standard', 1.15, 0.30, 2.00, TRUE)
ON CONFLICT (rule_name) DO NOTHING;

-- -----------------------------------------------------------------------
-- 4. Seed competitor pricing — local market comps
-- -----------------------------------------------------------------------
INSERT INTO public.competitor_pricing
  (item_name, category, price_per_unit, unit, competitor_name, region, notes)
VALUES
  -- Buffet dinner
  ('Buffet Dinner', 'per_person', 42.00, 'per_person', 'Valley Catering Co.',  'local', 'Standard 3-protein buffet'),
  ('Buffet Dinner', 'per_person', 48.00, 'per_person', 'Premier Events',        'local', 'Upscale buffet with chafing dishes'),
  ('Buffet Dinner', 'per_person', 38.50, 'per_person', 'Budget Bites',          'local', 'Economy buffet'),
  -- Buffet lunch
  ('Buffet Lunch',  'per_person', 28.00, 'per_person', 'Valley Catering Co.',  'local', 'Standard lunch buffet'),
  ('Buffet Lunch',  'per_person', 32.00, 'per_person', 'Premier Events',        'local', ''),
  -- Plated dinner
  ('Plated Dinner', 'per_person', 65.00, 'per_person', 'Premier Events',        'local', '3-course plated'),
  ('Plated Dinner', 'per_person', 58.00, 'per_person', 'Valley Catering Co.',  'local', '3-course plated'),
  ('Plated Dinner', 'per_person', 72.00, 'per_person', 'Grand Table Catering', 'local', 'Premium 4-course'),
  -- Appetizers
  ('Appetizer Package', 'per_person', 18.00, 'per_person', 'Valley Catering Co.',  'local', '5 passed apps'),
  ('Appetizer Package', 'per_person', 22.00, 'per_person', 'Premier Events',        'local', '6 passed apps'),
  ('Appetizer Package', 'per_person', 15.00, 'per_person', 'Budget Bites',          'local', '4 passed apps'),
  -- Bar packages
  ('Open Bar (4hr)',        'per_person', 35.00, 'per_person', 'Valley Catering Co.',  'local', 'Beer, wine, soft drinks'),
  ('Open Bar (4hr)',        'per_person', 42.00, 'per_person', 'Premier Events',        'local', 'Full bar'),
  ('Non-Alcoholic Package', 'per_person',  8.50, 'per_person', 'Valley Catering Co.',  'local', 'Coffee, tea, soft drinks'),
  -- Wedding
  ('Wedding Dinner', 'per_person', 85.00, 'per_person', 'Grand Table Catering', 'local', 'Premium 5-course'),
  ('Wedding Dinner', 'per_person', 75.00, 'per_person', 'Premier Events',        'local', '4-course'),
  ('Wedding Dinner', 'per_person', 68.00, 'per_person', 'Valley Catering Co.',  'local', '3-course'),
  -- Corporate
  ('Corporate Box Lunch', 'per_person', 18.00, 'per_person', 'Valley Catering Co.',  'local', 'Sandwich + sides'),
  ('Corporate Box Lunch', 'per_person', 22.00, 'per_person', 'Premier Events',        'local', 'Hot entrée + sides'),
  -- Dessert
  ('Dessert Station', 'per_person', 12.00, 'per_person', 'Valley Catering Co.',  'local', 'Cake + 2 options'),
  ('Dessert Station', 'per_person', 16.00, 'per_person', 'Premier Events',        'local', 'Full dessert display'),
  -- Salmon / seafood
  ('Salmon',          'per_person', 22.00, 'per_person', 'Premier Events',        'local', 'Atlantic salmon entrée'),
  ('Salmon',          'per_person', 19.00, 'per_person', 'Valley Catering Co.',  'local', 'Salmon fillet'),
  -- Chicken
  ('Chicken',         'per_person', 16.00, 'per_person', 'Valley Catering Co.',  'local', 'Herb-roasted chicken breast'),
  ('Chicken',         'per_person', 18.50, 'per_person', 'Premier Events',        'local', 'Stuffed chicken breast'),
  -- Beef / steak
  ('Beef',            'per_person', 26.00, 'per_person', 'Premier Events',        'local', 'Sirloin entrée'),
  ('Beef',            'per_person', 22.00, 'per_person', 'Valley Catering Co.',  'local', 'Beef tips'),
  -- Pasta
  ('Pasta',           'per_person',  9.50, 'per_person', 'Budget Bites',          'local', 'Pasta bar'),
  ('Pasta',           'per_person', 13.00, 'per_person', 'Valley Catering Co.',  'local', 'Pasta station')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------
-- 5. Row Level Security
-- -----------------------------------------------------------------------
ALTER TABLE public.competitor_pricing  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_price_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitor_pricing_service_all"
  ON public.competitor_pricing FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "menu_price_history_service_all"
  ON public.menu_price_history FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "pricing_rules_service_all"
  ON public.pricing_rules FOR ALL USING (true) WITH CHECK (true);
