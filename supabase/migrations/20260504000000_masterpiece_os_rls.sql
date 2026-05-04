-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- PROFILES TABLE (Brand Context)
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  state_of_incorporation TEXT,
  logo_url TEXT,
  primary_color TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Hard Wall Policy: Enable ALL for users based on their unique user_id
CREATE POLICY "Enable ALL for users based on user_id" 
ON profiles FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- EVENTS TABLE (Event Context / Real-time)
-- ==========================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT,
  total_guests INTEGER DEFAULT 0,
  staff_count INTEGER DEFAULT 0,
  hourly_rate NUMERIC DEFAULT 25.00,
  estimated_hours NUMERIC DEFAULT 6,
  mileage NUMERIC DEFAULT 15,
  menu_items JSONB DEFAULT '[]'::jsonb,
  inventory_costs NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Hard Wall Policy: Enable ALL for users based on their unique user_id
CREATE POLICY "Enable ALL for users based on user_id" 
ON events FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for the events table
alter publication supabase_realtime add table events;
