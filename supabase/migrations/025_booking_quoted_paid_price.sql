ALTER TABLE hms_bookings
  ADD COLUMN IF NOT EXISTS quoted_price numeric,
  ADD COLUMN IF NOT EXISTS paid_price numeric;
