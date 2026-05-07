-- ==========================================
-- Switchboard Integration: System Alerts
-- ==========================================

CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL DEFAULT 'Catering & Events by Wendy',
  alert_type TEXT NOT NULL, -- 'Active Session', 'Pending Handoff', 'Profit Alert', etc.
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_alerts_service_all"
  ON public.system_alerts FOR ALL USING (true) WITH CHECK (true);
