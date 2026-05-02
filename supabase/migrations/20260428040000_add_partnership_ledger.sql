-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 20260428040000 · Partnership Ledger & RBAC
--
-- 1. Create  public.legal_ownership   — canonical ownership record
-- 2. Alter   public.subscriber_profiles — add nbs_role column
-- 3. Seed    legal_ownership with the primary ownership entry
-- 4. Seed    subscriber_profiles for Bill North and Wendy with correct roles
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. legal_ownership table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.legal_ownership (
  id                   uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name          text         NOT NULL,
  entity_type          text         NOT NULL DEFAULT 'Sole Proprietorship / DBA',
  owner_name           text         NOT NULL,
  owner_email          text         NOT NULL,
  ownership_percentage numeric(5,2) NOT NULL DEFAULT 100.00
                         CHECK (ownership_percentage > 0 AND ownership_percentage <= 100),
  role_title           text         NOT NULL,
  effective_date       date         NOT NULL,
  notes                text,
  created_at           timestamptz  NOT NULL DEFAULT now(),
  updated_at           timestamptz  NOT NULL DEFAULT now()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.legal_ownership_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_legal_ownership_updated_at ON public.legal_ownership;
CREATE TRIGGER trg_legal_ownership_updated_at
  BEFORE UPDATE ON public.legal_ownership
  FOR EACH ROW EXECUTE FUNCTION public.legal_ownership_set_updated_at();

-- RLS — only the system admin (service-role key) should ever write here.
-- Authenticated users can SELECT to render the Ledger page.
ALTER TABLE public.legal_ownership ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "legal_ownership_select" ON public.legal_ownership;
CREATE POLICY "legal_ownership_select"
  ON public.legal_ownership FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "legal_ownership_service_write" ON public.legal_ownership;
CREATE POLICY "legal_ownership_service_write"
  ON public.legal_ownership FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── 2. Add nbs_role to subscriber_profiles ────────────────────────────────────
-- nbs_role controls business authority (executive_access, executive_chef, staff)
-- This is separate from the subscription tier (basic/professional/enterprise).

ALTER TABLE public.subscriber_profiles
  ADD COLUMN IF NOT EXISTS nbs_role text NOT NULL DEFAULT 'staff'
    CHECK (nbs_role IN ('system_admin', 'executive_chef', 'staff'));

-- Add display_name for personalised UI rendering
ALTER TABLE public.subscriber_profiles
  ADD COLUMN IF NOT EXISTS display_name text;

-- ── 3. Seed legal_ownership ───────────────────────────────────────────────────

INSERT INTO public.legal_ownership
  (entity_name, entity_type, owner_name, owner_email, ownership_percentage, role_title, effective_date, notes)
VALUES
  (
    'Catering By Wendy',
    'Sole Proprietorship / DBA',
    'William North',
    'northbusinessservices@gmail.com',
    100.00,
    'Sole Owner & System Administrator',
    '2024-01-01',
    'William North holds 100% ownership of the Catering By Wendy business entity and the NBS Engine platform. All legal, financial, and system-level decisions require Executive Access authorisation.'
  )
ON CONFLICT DO NOTHING;

-- ── 4. Seed subscriber_profiles for Bill North and Wendy ──────────────────────
-- Uses ON CONFLICT (user_id) DO UPDATE so this is idempotent.
-- NOTE: Replace the uuid literals below with the actual Supabase auth.users
--       UUIDs once the accounts are created in the Supabase dashboard.
--       The nbs_role and tier are the critical fields; the placeholder IDs
--       are safe to update after authentication is wired up.

-- Bill North — System Admin, Enterprise tier, Executive Access
INSERT INTO public.subscriber_profiles
  (user_id, display_name, full_name, email, tier, nbs_role, status)
VALUES
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Bill North',
    'William North',
    'northbusinessservices@gmail.com',
    'enterprise',
    'system_admin',
    'active'
  )
ON CONFLICT (user_id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    full_name    = EXCLUDED.full_name,
    email        = EXCLUDED.email,
    tier         = EXCLUDED.tier,
    nbs_role     = EXCLUDED.nbs_role,
    status       = EXCLUDED.status;

-- Wendy — Executive Chef, Enterprise tier, no executive access
INSERT INTO public.subscriber_profiles
  (user_id, display_name, full_name, email, tier, nbs_role, status)
VALUES
  (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'Wendy',
    'Wendy',
    'wendy@cateringbywendy.com',
    'enterprise',
    'executive_chef',
    'active'
  )
ON CONFLICT (user_id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    full_name    = EXCLUDED.full_name,
    email        = EXCLUDED.email,
    tier         = EXCLUDED.tier,
    nbs_role     = EXCLUDED.nbs_role,
    status       = EXCLUDED.status;
