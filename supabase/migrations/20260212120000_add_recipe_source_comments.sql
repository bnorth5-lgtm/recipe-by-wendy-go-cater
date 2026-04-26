-- Provenance + family notes for Cloud Vault `recipes` table.
-- Run via Supabase SQL Editor, or `supabase db push` if this repo is linked.

alter table public.recipes
  add column if not exists source text;

alter table public.recipes
  add column if not exists comments text;
