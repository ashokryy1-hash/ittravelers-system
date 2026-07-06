ALTER TABLE hms_bookings
  ADD COLUMN IF NOT EXISTS room_type_name text;

ALTER TABLE hms_tours
  ADD COLUMN IF NOT EXISTS destination text;
