CREATE TABLE IF NOT EXISTS harrison_build_manifest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    snap_mode TEXT NOT NULL,
    guest_count INT NOT NULL,
    elements JSONB NOT NULL,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: Add RLS policies if needed
ALTER TABLE harrison_build_manifest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read access to harrison_build_manifest" ON harrison_build_manifest FOR SELECT USING (true);
CREATE POLICY "Allow all insert access to harrison_build_manifest" ON harrison_build_manifest FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access to harrison_build_manifest" ON harrison_build_manifest FOR UPDATE USING (true);
