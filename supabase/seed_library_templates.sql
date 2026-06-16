-- Delete all templates except Nusa Penida
DELETE FROM hms_activity_templates
WHERE name NOT ILIKE '%nusa penida%';

-- Insert Ahmed Hassan style day templates
INSERT INTO hms_activity_templates (name, icon, activities) VALUES

('Airport Arrival Transfer', '✈️', '[
  {"time": "", "description": "Flight no: ___ 🚗 Transfer: Airport → Hotel"}
]'::jsonb),

('Airport Departure Transfer', '🛫', '[
  {"time": "", "description": "Flight no: ___ 🚗 Transfer: Hotel → Airport"}
]'::jsonb),

('Finn''s Beach Club', '🌊', '[
  {"time": "15:00", "description": "🚗 Transfer: Hotel → Finn''s Beach Club"},
  {"time": "23:00", "description": "🚗 Transfer: Finn''s Beach Club → Hotel"}
]'::jsonb),

('Malini Uluwatu + Savaya', '🌅', '[
  {"time": "14:30", "description": "🚗 Transfer: Hotel → Malini Uluwatu - SEAFOOD & SUNSET"},
  {"time": "19:00", "description": "🚗 Transfer: Malini Uluwatu - SEAFOOD & SUNSET → Savaya Beach Club"},
  {"time": "22:00", "description": "🚗 Transfer: Savaya Beach Club → Hotel"}
]'::jsonb),

('Jungle ATV Ubud', '🏍️', '[
  {"time": "10:00", "description": "Jungle ATV (double bike) — The Jungle Club Ubud"}
]'::jsonb),

('Rafting + Omma Day Club', '🚣', '[
  {"time": "10:00", "description": "Rafting (sharing boat)"},
  {"time": "13:00", "description": "Omma Day Club"}
]'::jsonb),

('Elephant Safari Ubud', '🐘', '[
  {"time": "10:00", "description": "Elephant Safari — Tis Cafe Ubud"}
]'::jsonb),

('Transfer Between Hotels', '🚗', '[
  {"time": "", "description": "🚗 Transfer: ___ → ___"}
]'::jsonb);
