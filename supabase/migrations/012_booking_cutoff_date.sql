-- Add payment cutoff date to bookings
-- When a hotel confirms with a payment deadline, store it here.
-- The UI shows a warning badge 14 days before this date.

ALTER TABLE hms_bookings ADD COLUMN IF NOT EXISTS cutoff_date date;
