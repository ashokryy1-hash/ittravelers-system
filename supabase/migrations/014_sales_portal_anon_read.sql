-- Allow anonymous (unauthenticated) read access to hotels and room types
-- so the sales portal at /sales works without login.
-- Rates, contacts, and emails remain protected.

CREATE POLICY IF NOT EXISTS "anon_read_hotels"
  ON hms_hotels FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "anon_read_rooms"
  ON hms_room_types FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "anon_read_destinations"
  ON hms_destinations FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "anon_read_surcharges"
  ON hms_surcharge_rules FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "anon_read_settings"
  ON hms_settings FOR SELECT
  USING (true);
