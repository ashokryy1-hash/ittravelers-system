-- Save Discovery search results so they persist across sessions
CREATE TABLE IF NOT EXISTS hms_discovery_saved (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id    text UNIQUE NOT NULL,
  name        text NOT NULL,
  formatted_address text,
  destination text,
  area        text,
  rating      numeric,
  website     text,
  google_maps_url text,
  contact_email text,
  added_to_outreach boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE hms_discovery_saved ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON hms_discovery_saved FOR ALL USING (auth.role() = 'authenticated');
