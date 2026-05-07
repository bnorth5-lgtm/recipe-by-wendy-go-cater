-- ==========================================
-- Add NBS Global Standards to Events
-- ==========================================

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS market_scraped_cost NUMERIC,
ADD COLUMN IF NOT EXISTS margin_goal NUMERIC DEFAULT 70.00,
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;
