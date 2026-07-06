ALTER TABLE hms_bookings
  ADD COLUMN IF NOT EXISTS source text;

ALTER TABLE hms_inbox_emails
  ADD COLUMN IF NOT EXISTS client_phone text,
  ADD COLUMN IF NOT EXISTS dollar_rate numeric;
