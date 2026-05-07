-- ==========================================
-- NBS Intelligence Layer Integration
-- ==========================================

-- 1. Licensing: Add concierge_license_key to company settings
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS concierge_license_key TEXT;

-- 2. Visionary Integration: Add s_e_e_oversight metadata to events
ALTER TABLE events
ADD COLUMN IF NOT EXISTS s_e_e_oversight JSONB DEFAULT '{}'::jsonb;

-- 3. Database Expansion: NBS Inventory Items
CREATE TABLE IF NOT EXISTS public.nbs_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  item_category TEXT, -- Floral, AV, Structure, etc.
  current_cost NUMERIC(10,2) DEFAULT 0,
  market_scraped_cost NUMERIC(10,2) DEFAULT 0,
  margin_goal NUMERIC(5,2) DEFAULT 70.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.nbs_inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nbs_inventory_items_service_all"
  ON public.nbs_inventory_items FOR ALL USING (true) WITH CHECK (true);

-- 4. Profit Monitoring: View for Dash
CREATE OR REPLACE VIEW public.nbs_profit_warnings AS
SELECT 
  id,
  item_name,
  item_category,
  current_cost,
  market_scraped_cost,
  margin_goal,
  -- Calculate projected margin based on scraped market price vs our current cost
  CASE 
    WHEN market_scraped_cost > 0 THEN ROUND(((market_scraped_cost - current_cost) / market_scraped_cost) * 100, 2)
    ELSE 0
  END AS projected_margin
FROM public.nbs_inventory_items
WHERE CASE 
    WHEN market_scraped_cost > 0 THEN ROUND(((market_scraped_cost - current_cost) / market_scraped_cost) * 100, 2)
    ELSE 0
  END < margin_goal;
