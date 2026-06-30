-- Add status and booking link to tours (whole tour)
ALTER TABLE hms_tours
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS booking_link text;

-- Add status and booking link to each day
ALTER TABLE hms_tour_days
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS booking_link text;
