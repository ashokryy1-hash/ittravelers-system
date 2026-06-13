-- Hotel Management System (HMS) Tables
-- Module 0 + 1: Outreach

CREATE TABLE IF NOT EXISTS hms_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hms_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid REFERENCES hms_destinations(id),
  name text NOT NULL,
  sort_order int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS hms_outreach_hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  destination_id uuid REFERENCES hms_destinations(id),
  city text,
  star_rating int,
  website text,
  google_maps_url text,
  contact_name text,
  contact_email text,
  email_source text DEFAULT 'manual', -- "extracted" | "manual" | "not_found"
  stage text DEFAULT 'Prospect',
  -- Prospect/Contacted/Replied/Negotiating/Signed/Declined
  date_added date DEFAULT CURRENT_DATE,
  last_contact_date date,
  follow_up_date date,
  notes text,
  contract_file_url text,
  google_place_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hms_outreach_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hms_outreach_hotels(id) ON DELETE CASCADE,
  direction text NOT NULL, -- "sent" | "received"
  subject text,
  body text,
  sent_at timestamptz DEFAULT now()
);

-- Module 2: Rate management

CREATE TABLE IF NOT EXISTS hms_hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  destination_id uuid REFERENCES hms_destinations(id),
  city text,
  star_rating int,
  chain text,
  contract_status text DEFAULT 'Active', -- "Active" | "Expiring soon" | "Expired"
  valid_from date,
  valid_to date,
  booking_window_from date,
  booking_window_to date,
  contact_name text,
  contact_email text,
  surcharge_waiver text DEFAULT 'none', -- "none" | "50%" | "100%"
  photo_link_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hms_room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hms_hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  room_category text, -- "room" | "villa"
  low_season_rate numeric,
  high_season_rate numeric,
  peak_season_rate numeric,
  currency text DEFAULT 'IDR',
  meal_plan text,
  availability int,
  notes text,
  sort_order int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS hms_surcharge_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid REFERENCES hms_destinations(id),
  season_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  room_surcharge numeric DEFAULT 0,
  villa_surcharge numeric DEFAULT 0
);

-- Module 3: Reservations

CREATE TABLE IF NOT EXISTS hms_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  hotel_id uuid REFERENCES hms_hotels(id),
  room_type_id uuid REFERENCES hms_room_types(id),
  checkin_date date NOT NULL,
  checkout_date date NOT NULL,
  nights int,
  rate_per_night numeric,
  total_price_idr numeric,
  total_price_egp numeric,
  currency text DEFAULT 'IDR',
  meal_plan text,
  status text DEFAULT 'Availability pending',
  hotel_confirmation_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hms_booking_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES hms_bookings(id) ON DELETE CASCADE,
  direction text NOT NULL, -- "sent" | "received"
  subject text,
  body text,
  sent_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hms_settings (
  key text PRIMARY KEY,
  value text
);

-- RLS: enable but allow all for authenticated users (single-user internal tool)
ALTER TABLE hms_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hms_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE hms_outreach_hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE hms_outreach_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE hms_hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE hms_room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE hms_surcharge_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE hms_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hms_booking_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE hms_settings ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can do everything
CREATE POLICY "auth_all" ON hms_destinations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON hms_cities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON hms_outreach_hotels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON hms_outreach_emails FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON hms_hotels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON hms_room_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON hms_surcharge_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON hms_bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON hms_booking_emails FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON hms_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed data: Destinations
INSERT INTO hms_destinations (name, is_active) VALUES
  ('Bali', true),
  ('Thailand', false),
  ('Vietnam', false)
ON CONFLICT DO NOTHING;

-- Seed data: Bali cities
INSERT INTO hms_cities (destination_id, name, sort_order)
SELECT d.id, c.name, c.ord FROM hms_destinations d
JOIN (VALUES
  ('Ubud', 1), ('Seminyak', 2), ('Canggu', 3), ('Uluwatu', 4),
  ('Jimbaran', 5), ('Nusa Penida', 6), ('Sanur', 7), ('Karangasem', 8),
  ('Kintamani', 9), ('Nusa Ceningan', 10), ('Gili Trawangan', 11), ('Tabanan', 12)
) AS c(name, ord) ON true
WHERE d.name = 'Bali'
ON CONFLICT DO NOTHING;

-- Seed data: Surcharge rules for Bali
INSERT INTO hms_surcharge_rules (destination_id, season_name, start_date, end_date, room_surcharge, villa_surcharge)
SELECT d.id, s.season_name, s.start_date::date, s.end_date::date, s.room_sc, s.villa_sc
FROM hms_destinations d
JOIN (VALUES
  ('High Season 2026', '2026-07-01', '2026-08-31', 450000, 700000),
  ('High Season 2027', '2027-03-07', '2027-03-12', 450000, 700000),
  ('Peak Season 2026', '2026-12-23', '2027-01-05', 600000, 800000)
) AS s(season_name, start_date, end_date, room_sc, villa_sc) ON true
WHERE d.name = 'Bali'
ON CONFLICT DO NOTHING;

-- Seed data: Settings
INSERT INTO hms_settings (key, value) VALUES
  ('IDR_to_EGP', '0.0018'),
  ('THB_to_EGP', '0.085'),
  ('USD_to_EGP', '50.5'),
  ('outlook_sender_email', ''),
  ('outlook_sender_name', 'ITTravelers'),
  ('agency_signature', 'Best regards,\nITTravelers\nYour Egyptian Travel Partner'),
  ('google_places_api_key', ''),
  ('followup_reminder_days', '7')
ON CONFLICT DO NOTHING;
