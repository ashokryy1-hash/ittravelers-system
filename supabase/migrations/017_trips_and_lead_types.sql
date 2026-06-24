-- Trip library (group trips)
CREATE TABLE hms_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  destination text NOT NULL DEFAULT 'Bali',
  departure_date date,
  return_date date,
  price_per_person numeric,
  currency text DEFAULT 'EGP',
  capacity integer DEFAULT 20,
  program_link text,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hms_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_trips" ON hms_trips FOR ALL USING (auth.role() = 'authenticated');

-- Add lead type and trip reference to existing leads table
ALTER TABLE hms_leads
  ADD COLUMN IF NOT EXISTS lead_type text DEFAULT 'honeymoon'
    CHECK (lead_type IN ('honeymoon', 'group')),
  ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES hms_trips(id) ON DELETE SET NULL;
