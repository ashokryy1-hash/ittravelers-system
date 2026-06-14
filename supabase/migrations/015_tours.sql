-- Tour itineraries
CREATE TABLE hms_tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  pax integer NOT NULL DEFAULT 2,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Days within a tour
CREATE TABLE hms_tour_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid REFERENCES hms_tours(id) ON DELETE CASCADE,
  date date,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Activities/items within a day
CREATE TABLE hms_tour_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid REFERENCES hms_tour_days(id) ON DELETE CASCADE,
  time text,
  description text NOT NULL,
  sort_order integer DEFAULT 0
);

-- Reusable activity library (pre-built day templates)
CREATE TABLE hms_activity_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text DEFAULT '🌴',
  activities jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hms_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE hms_tour_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE hms_tour_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE hms_activity_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_tours" ON hms_tours FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all_tour_days" ON hms_tour_days FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all_tour_activities" ON hms_tour_activities FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all_templates" ON hms_activity_templates FOR ALL USING (auth.role() = 'authenticated');

-- Pre-seed common Bali day templates
INSERT INTO hms_activity_templates (name, icon, activities) VALUES
('Nusa Penida Full Day', '🏝', '[
  {"time": "06:00", "description": "Pickup from hotel"},
  {"time": "07:30", "description": "Boat to Nusa Penida"},
  {"time": "09:30", "description": "Tree House"},
  {"time": "10:30", "description": "Diamond Beach"},
  {"time": "12:30", "description": "Kelingking Beach"},
  {"time": "14:30", "description": "Secret Beach Club (expenses on own account)"},
  {"time": "16:30", "description": "Boat back to Bali"},
  {"time": "17:30", "description": "Transfer back to hotel"}
]'),
('Ubud Day Tour', '🌿', '[
  {"time": "09:00", "description": "Pickup from hotel"},
  {"time": "10:00", "description": "Monkey Forest"},
  {"time": "12:00", "description": "Rafting (free lunch)"},
  {"time": "15:00", "description": "Tegalalang Rice Terrace (swing not included)"},
  {"time": "16:00", "description": "Cretya (pool access included for 18+)"},
  {"time": "18:00", "description": "Transfer back to hotel"}
]'),
('East Bali Day', '🌄', '[
  {"time": "07:00", "description": "Pickup from hotel"},
  {"time": "09:00", "description": "Lempuyang Temple"},
  {"time": "13:30", "description": "Bali Swing"},
  {"time": "16:00", "description": "Tegenungan Waterfall"},
  {"time": "17:00", "description": "Omma Day Club"},
  {"time": "19:00", "description": "Transfer back to hotel"}
]'),
('Uluwatu Sunset', '🌅', '[
  {"time": "16:00", "description": "Pickup from hotel"},
  {"time": "16:30", "description": "Savaya Beach Club"},
  {"time": "19:30", "description": "Transfer back to hotel"}
]'),
('Airport Pickup', '✈️', '[
  {"time": "TBC", "description": "Pickup from Ngurah Rai Airport"},
  {"time": "TBC", "description": "Transfer to hotel"}
]'),
('Airport Drop', '✈️', '[
  {"time": "TBC", "description": "Pickup from hotel"},
  {"time": "TBC", "description": "Drop to Ngurah Rai Airport"}
]');
