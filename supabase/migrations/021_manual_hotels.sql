CREATE TABLE hms_manual_hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  city text,
  country text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hms_manual_hotels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_manual_hotels" ON hms_manual_hotels FOR ALL USING (auth.role() = 'authenticated');
