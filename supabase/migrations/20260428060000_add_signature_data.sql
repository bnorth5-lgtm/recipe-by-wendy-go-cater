-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 20260428060000 · Client Portal — signature_data column
--
-- Adds the client signature storage to event_orders so that when a client
-- opens their portal link (/portal/:id), signs the BEO, and clicks
-- "Finalize Order", the Base64 PNG is persisted and status is set to 'Signed'.
--
-- The status field is plain TEXT (no CHECK constraint), so the new 'Signed'
-- value is valid without any schema change beyond adding the column.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.event_orders
  ADD COLUMN IF NOT EXISTS signature_data TEXT,
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signer_name TEXT;

COMMENT ON COLUMN public.event_orders.signature_data IS
  'Base64-encoded PNG of the client''s digital signature captured via the Client Portal.';

COMMENT ON COLUMN public.event_orders.signed_at IS
  'Timestamp when the client clicked "Finalize Order" in the portal.';

COMMENT ON COLUMN public.event_orders.signer_name IS
  'Client''s printed name as entered in the portal signature block.';

-- Index to quickly find all signed orders (for reporting / billing)
CREATE INDEX IF NOT EXISTS idx_event_orders_signed
  ON public.event_orders (signed_at DESC)
  WHERE signed_at IS NOT NULL;
