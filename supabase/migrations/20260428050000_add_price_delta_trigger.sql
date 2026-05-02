-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 20260428050000 · Price Delta Trigger for menu_price_history
--
-- Adds two columns to menu_price_history:
--   price_delta  NUMERIC(8,4)  — % change from previous price for this item
--                                e.g. -10.0000 = "10 % cheaper than last time"
--   albert_flag  TEXT          — 'Opportunity' | 'Cost Alert' | 'No Change'
--                                | 'Initial Price'
--
-- A BEFORE INSERT trigger fires on every new row and:
--   1. Looks up the most recent prior price for the same item_id.
--   2. Computes price_delta = ((new_price - prev_price) / prev_price) * 100.
--   3. Sets albert_flag based on the sign of price_delta.
--   4. Back-fills old_price if the application left it NULL.
--
-- The trigger uses BEFORE (not AFTER) so it can mutate NEW before storage.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. New columns ────────────────────────────────────────────────────────────

ALTER TABLE public.menu_price_history
  ADD COLUMN IF NOT EXISTS price_delta NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS albert_flag TEXT
    CHECK (albert_flag IN ('Opportunity', 'Cost Alert', 'No Change', 'Initial Price'));

COMMENT ON COLUMN public.menu_price_history.price_delta IS
  'Percentage change from the previous price for this item_id. '
  'NULL when no prior record exists (initial pricing event). '
  'Negative = cheaper, positive = more expensive.';

COMMENT ON COLUMN public.menu_price_history.albert_flag IS
  'Albert''s classification of this price movement. '
  '''Opportunity'' = price decreased (cost savings available). '
  '''Cost Alert''  = price increased (margin risk). '
  '''No Change''   = identical to previous price. '
  '''Initial Price'' = first-ever pricing entry for this item.';

-- ── 2. Performance index ──────────────────────────────────────────────────────
-- The trigger subquery orders by applied_at DESC for a given item_id on every
-- INSERT.  Without this index it would do a sequential scan.

CREATE INDEX IF NOT EXISTS idx_menu_price_history_item_time
  ON public.menu_price_history (item_id, applied_at DESC);

-- ── 3. Trigger function ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_menu_price_history_set_delta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER          -- runs as the table owner, avoids RLS recursion
SET search_path = public  -- pin search_path to prevent hijacking
AS $$
DECLARE
  v_prev_price NUMERIC(10,2);
  v_delta      NUMERIC(8,4);
BEGIN
  -- ── Look up the most recent prior price for this item_id ──────────────────
  -- Because this is BEFORE INSERT, the current row is NOT yet in the table,
  -- so this subquery reliably returns the previous record only.
  SELECT new_price
  INTO   v_prev_price
  FROM   public.menu_price_history
  WHERE  item_id = NEW.item_id
  ORDER  BY applied_at DESC
  LIMIT  1;

  -- ── Case 1: No prior record (initial pricing event) ───────────────────────
  IF v_prev_price IS NULL THEN
    NEW.price_delta := NULL;
    NEW.albert_flag := 'Initial Price';

    -- Back-fill old_price with NULL to be explicit
    IF NEW.old_price IS NULL THEN
      NEW.old_price := NULL;
    END IF;

    RETURN NEW;
  END IF;

  -- ── Case 2: Prior price found ─────────────────────────────────────────────

  -- Back-fill old_price if the application did not supply it
  IF NEW.old_price IS NULL THEN
    NEW.old_price := v_prev_price;
  END IF;

  -- Guard against division by zero (should never happen, but be safe)
  IF v_prev_price = 0 THEN
    NEW.price_delta := NULL;
    NEW.albert_flag := 'Initial Price';
    RETURN NEW;
  END IF;

  -- Calculate percentage difference, rounded to 4 decimal places
  v_delta := ROUND(
    ((NEW.new_price - v_prev_price) / v_prev_price) * 100,
    4
  );

  NEW.price_delta := v_delta;

  -- ── Albert's classification ───────────────────────────────────────────────
  -- Threshold: use 0.005 (0.005%) to absorb floating-point rounding noise
  -- so that a $10.00 → $10.00 round-trip does not produce a spurious flag.
  IF v_delta < -0.005 THEN
    -- Price went DOWN: ingredient or dish costs less than before.
    -- This is a buying opportunity / margin improvement.
    NEW.albert_flag := 'Opportunity';

  ELSIF v_delta > 0.005 THEN
    -- Price went UP: costs more. Flag for review before committing to client.
    NEW.albert_flag := 'Cost Alert';

  ELSE
    -- Effectively unchanged (within noise threshold)
    NEW.albert_flag := 'No Change';
  END IF;

  RETURN NEW;
END;
$$;

-- ── 4. Bind trigger to the table ─────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_menu_price_history_set_delta
  ON public.menu_price_history;

CREATE TRIGGER trg_menu_price_history_set_delta
  BEFORE INSERT
  ON public.menu_price_history
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_menu_price_history_set_delta();

-- ── 5. Back-fill existing rows (best-effort, chronological order) ─────────────
-- For rows already in the table we calculate delta by comparing each row to
-- the immediately prior row (by applied_at) for the same item_id.
-- Uses a window function so no application code is required.

WITH ordered AS (
  SELECT
    id,
    item_id,
    new_price,
    applied_at,
    LAG(new_price)
      OVER (PARTITION BY item_id ORDER BY applied_at)  AS prev_price
  FROM public.menu_price_history
),
computed AS (
  SELECT
    id,
    prev_price,
    CASE
      WHEN prev_price IS NULL OR prev_price = 0
        THEN NULL
      ELSE
        ROUND(((new_price - prev_price) / prev_price) * 100, 4)
    END AS delta
  FROM ordered
)
UPDATE public.menu_price_history mph
SET
  old_price   = COALESCE(mph.old_price, c.prev_price),
  price_delta = c.delta,
  albert_flag = CASE
    WHEN c.delta IS NULL                  THEN 'Initial Price'
    WHEN c.delta < -0.005                 THEN 'Opportunity'
    WHEN c.delta >  0.005                 THEN 'Cost Alert'
    ELSE                                       'No Change'
  END
FROM computed c
WHERE mph.id = c.id
  AND mph.albert_flag IS NULL;   -- only touch rows that haven't been classified yet
